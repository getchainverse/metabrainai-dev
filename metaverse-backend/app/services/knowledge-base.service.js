const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const { ChromaClient } = require("chromadb");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { pipeline } = require("@xenova/transformers");
const prisma = require("../prisma/client");

const uploadDir = path.join(__dirname, "..", "..", "uploads", "knowledge-bases");
const allowedMimeTypes = new Set([
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

let embeddingPipelinePromise;

const getChromaClient = () =>
  new ChromaClient({
    path: process.env.CHROMA_URL || "http://localhost:8000",
  });

const getEmbeddingPipeline = () => {
  if (!embeddingPipelinePromise) {
    embeddingPipelinePromise = pipeline(
      "feature-extraction",
      process.env.EMBEDDING_MODEL || "Xenova/all-MiniLM-L6-v2"
    );
  }

  return embeddingPipelinePromise;
};

const normalizeVector = (vector) => {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / magnitude);
};

const embedTexts = async (texts) => {
  const extractor = await getEmbeddingPipeline();
  const embeddings = [];

  for (const text of texts) {
    const output = await extractor(text, { pooling: "mean", normalize: true });
    embeddings.push(Array.from(output.data));
  }

  return embeddings.map(normalizeVector);
};

const ensureUploadDir = () => fs.mkdir(uploadDir, { recursive: true });

const sanitizeName = (value) =>
  String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_.-]/g, "-")
    .slice(0, 120);

const validateKnowledgeInput = (payload, file) => {
  const errors = {};
  const name = String(payload.name || "").trim();
  const description = String(payload.description || "").trim();
  const roleIds = Array.isArray(payload.roleIds)
    ? payload.roleIds
    : String(payload.roleIds || "")
        .split(",")
        .map((roleId) => roleId.trim())
        .filter(Boolean);

  if (!name) errors.name = "Knowledge base name is required.";
  if (name.length > 80) errors.name = "Name must be 80 characters or less.";
  if (description.length > 240) {
    errors.description = "Description must be 240 characters or less.";
  }
  if (!file) errors.file = "PDF, TXT, or DOCX file is required.";
  if (file && !allowedMimeTypes.has(file.mimetype)) {
    errors.file = "Only PDF, TXT, and DOCX files are supported.";
  }

  if (Object.keys(errors).length) {
    const error = new Error("Knowledge base validation failed.");
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }

  return { name, description, roleIds };
};

const extractText = async (filePath, mimetype) => {
  const buffer = await fs.readFile(filePath);

  if (mimetype === "application/pdf") {
    const parsed = await pdfParse(buffer);
    return parsed.text;
  }

  if (mimetype === "text/plain") {
    return buffer.toString("utf8");
  }

  const parsed = await mammoth.extractRawText({ buffer });
  return parsed.value;
};

const chunkText = async (text) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: Number(process.env.RAG_CHUNK_SIZE || 1000),
    chunkOverlap: Number(process.env.RAG_CHUNK_OVERLAP || 150),
  });

  return splitter.splitText(text);
};

const getCollection = async (collectionName) => {
  const client = getChromaClient();
  return client.getOrCreateCollection({
    name: collectionName,
    metadata: { "hnsw:space": "cosine" },
  });
};

const createKnowledgeBaseFromUpload = async ({ payload, file }) => {
  await ensureUploadDir();
  const input = validateKnowledgeInput(payload, file);
  const fileId = crypto.randomUUID();
  const safeFileName = `${fileId}-${sanitizeName(file.originalname)}`;
  const filePath = path.join(uploadDir, safeFileName);

  await fs.rename(file.path, filePath);

  const text = await extractText(filePath, file.mimetype);
  if (!text || !text.trim()) {
    const error = new Error("No readable text was found in the uploaded document.");
    error.statusCode = 400;
    throw error;
  }

  const chunks = await chunkText(text);
  const collectionName = `kb_${fileId.replace(/-/g, "_")}`;
  const embeddings = await embedTexts(chunks);
  const collection = await getCollection(collectionName);
  const ids = chunks.map((_, index) => `${fileId}_${index}`);
  const metadatas = chunks.map((_, index) => ({
    source: file.originalname,
    chunkIndex: index,
  }));

  await collection.add({
    ids,
    documents: chunks,
    embeddings,
    metadatas,
  });

  return prisma.knowledgeBase.create({
    data: {
      name: input.name,
      description: input.description,
      sourceType: "document",
      status: "ready",
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      chunkCount: chunks.length,
      chromaCollection: collectionName,
      roles: { connect: input.roleIds.map((id) => ({ id })) },
    },
    include: { roles: true },
  });
};

const searchKnowledgeBases = async ({ query, knowledgeBaseId, limit = 5 }) => {
  const searchText = String(query || "").trim();

  if (!searchText) {
    const error = new Error("Search query is required.");
    error.statusCode = 400;
    throw error;
  }

  const where = {
    status: "ready",
    chromaCollection: { not: null },
    ...(knowledgeBaseId ? { id: knowledgeBaseId } : {}),
  };
  const knowledgeBases = await prisma.knowledgeBase.findMany({
    where,
    include: { roles: true },
    orderBy: { updatedAt: "desc" },
  });
  const queryEmbedding = (await embedTexts([searchText]))[0];
  const results = [];

  for (const knowledgeBase of knowledgeBases) {
    const collection = await getCollection(knowledgeBase.chromaCollection);
    const response = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: Math.min(Number(limit) || 5, 10),
    });
    const documents = response.documents?.[0] || [];
    const distances = response.distances?.[0] || [];
    const metadatas = response.metadatas?.[0] || [];

    documents.forEach((document, index) => {
      results.push({
        knowledgeBaseId: knowledgeBase.id,
        knowledgeBaseName: knowledgeBase.name,
        document,
        distance: distances[index],
        metadata: metadatas[index],
      });
    });
  }

  const rankedResults = results
    .sort((a, b) => (a.distance || 0) - (b.distance || 0))
    .slice(0, Math.min(Number(limit) || 5, 10));

  return {
    answer: rankedResults.length
      ? rankedResults.map((result) => result.document).join("\n\n")
      : "No matching knowledge base content was found.",
    results: rankedResults,
  };
};

const deleteKnowledgeBase = async (id) => {
  const knowledgeBase = await prisma.knowledgeBase.findUnique({ where: { id } });

  if (!knowledgeBase) {
    const error = new Error("Knowledge base not found.");
    error.statusCode = 404;
    throw error;
  }

  if (knowledgeBase.chromaCollection) {
    try {
      const client = getChromaClient();
      await client.deleteCollection({ name: knowledgeBase.chromaCollection });
    } catch (error) {
      // Deleting metadata should not be blocked by an already-missing Chroma collection.
    }
  }

  return prisma.knowledgeBase.delete({ where: { id } });
};

module.exports = {
  createKnowledgeBaseFromUpload,
  deleteKnowledgeBase,
  searchKnowledgeBases,
};
