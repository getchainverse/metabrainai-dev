const multer = require("multer");
const path = require("path");
const fs = require("fs");
const knowledgeBaseService = require("../services/knowledge-base.service");
const { sendError } = require("../utils/http");

const tmpDir = path.join(__dirname, "..", "..", "tmp");
fs.mkdirSync(tmpDir, { recursive: true });

const upload = multer({
  dest: tmpDir,
  limits: { fileSize: 25 * 1024 * 1024 },
});

exports.uploadMiddleware = upload.single("file");

exports.upload = async (req, res) => {
  try {
    const knowledgeBase = await knowledgeBaseService.createKnowledgeBaseFromUpload({
      payload: req.body,
      file: req.file,
    });

    return res.status(201).send({ data: knowledgeBase });
  } catch (error) {
    return sendError(res, error, "Knowledge base request failed.");
  }
};

exports.search = async (req, res) => {
  try {
    const result = await knowledgeBaseService.searchKnowledgeBases(req.body);
    return res.status(200).send({ data: result });
  } catch (error) {
    return sendError(res, error, "Knowledge base request failed.");
  }
};
