const prisma = require("../prisma/client");
const knowledgeBaseService = require("./knowledge-base.service");

const DEFAULT_NPC = {
  key: "guide-01",
  name: "Astra",
  greeting: "Hey, I can help you find your way around.",
  knowledgeBaseId: null,
};

const streamToResponse = (res, payload) => {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
};

const getOrCreateConversation = async ({ userId, npcKey = DEFAULT_NPC.key }) => {
  let conversation = await prisma.npcConversation.findFirst({
    where: { userId, npcKey },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!conversation) {
    conversation = await prisma.npcConversation.create({
      data: {
        userId,
        npcKey,
        title: DEFAULT_NPC.name,
      },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
  }

  return conversation;
};

const buildContext = async ({ question, knowledgeBaseId }) => {
  try {
    const result = await knowledgeBaseService.searchKnowledgeBases({
      query: question,
      knowledgeBaseId,
      limit: 4,
    });

    return {
      context: result.answer,
      citations: result.results || [],
    };
  } catch (error) {
    return { context: "", citations: [] };
  }
};

const generateReply = async ({ conversation, question, knowledgeBaseId, onChunk }) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const error = new Error("OPENAI_API_KEY is not configured.");
    error.statusCode = 500;
    throw error;
  }

  const { context, citations } = await buildContext({ question, knowledgeBaseId });
  const messages = [
    {
      role: "system",
      content:
        "You are Astra, an NPC inside a metaverse. Be concise, warm, and helpful. Use the knowledge base context when relevant. If you reference facts, keep them grounded in the context.",
    },
    {
      role: "system",
      content: `Knowledge base context:\n${context || "No extra context available."}`,
    },
    ...conversation.messages.map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.content,
    })),
    { role: "user", content: question },
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages,
      temperature: 0.7,
      stream: true,
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error("Failed to generate an NPC response.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") continue;

      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content || "";
        if (delta) {
          fullText += delta;
          if (onChunk) onChunk(delta);
        }
      } catch (error) {
        // Ignore malformed chunks.
      }
    }
  }

  const savedConversation = await prisma.npcConversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });

  await prisma.npcMessage.createMany({
    data: [
      {
        conversationId: savedConversation.id,
        role: "user",
        content: question,
      },
      {
        conversationId: savedConversation.id,
        role: "assistant",
        content: fullText || "I’m here.",
        citations,
      },
    ],
  });

  return { reply: fullText || "I’m here.", citations };
};

const getConversationHistory = async ({ userId, npcKey = DEFAULT_NPC.key }) => {
  const conversation = await getOrCreateConversation({ userId, npcKey });
  return conversation.messages;
};

module.exports = {
  DEFAULT_NPC,
  getOrCreateConversation,
  generateReply,
  getConversationHistory,
  streamToResponse,
};
