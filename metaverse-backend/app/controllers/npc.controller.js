const npcChatService = require("../services/npc-chat.service");

exports.history = async (req, res) => {
  try {
    const messages = await npcChatService.getConversationHistory({
      userId: req.userId,
      npcKey: req.query.npcKey,
    });
    return res.status(200).send({ data: messages });
  } catch (error) {
    return res.status(error.statusCode || 500).send({
      message: error.message || "Unable to load conversation history.",
    });
  }
};

exports.chat = async (req, res) => {
  try {
    const question = String(req.body.message || "").trim();
    if (!question) {
      return res.status(400).send({ message: "Message is required." });
    }

    const conversation = await npcChatService.getOrCreateConversation({
      userId: req.userId,
      npcKey: req.body.npcKey,
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    let streamed = "";
    await npcChatService.generateReply({
      conversation,
      question,
      knowledgeBaseId: req.body.knowledgeBaseId,
      onChunk: (chunk) => {
        streamed += chunk;
        npcChatService.streamToResponse(res, { type: "chunk", chunk });
      },
    });

    npcChatService.streamToResponse(res, {
      type: "done",
      reply: streamed,
    });
    res.end();
  } catch (error) {
    if (!res.headersSent) {
      return res.status(error.statusCode || 500).send({
        message: error.message || "Unable to chat with NPC.",
      });
    }

    npcChatService.streamToResponse(res, {
      type: "error",
      message: error.message || "Unable to chat with NPC.",
    });
    return res.end();
  }
};
