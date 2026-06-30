import AuthService from "./auth.service";
import { API_BASE_URL } from "../config/env";
import { apiRequest } from "./api";

const API_URL = `${API_BASE_URL}/api/npc`;

const getHistory = (npcKey) =>
  apiRequest("get", "/api/npc/history", undefined, { npcKey }).then(
    (data) => data || []
  );

const chatStream = async ({ message, npcKey, knowledgeBaseId, onChunk }) => {
  const response = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...AuthService.getAuthHeader(),
    },
    body: JSON.stringify({ message, npcKey, knowledgeBaseId }),
  });

  if (!response.ok || !response.body) {
    const errorText = await response.text();
    throw new Error(errorText || "Unable to contact the NPC.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalReply = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() || "";

    for (const part of parts) {
      const line = part
        .split("\n")
        .find((entry) => entry.startsWith("data:"));
      if (!line) continue;

      const payload = line.slice(5).trim();
      if (!payload) continue;

      try {
        const parsed = JSON.parse(payload);
        if (parsed.type === "chunk" && parsed.chunk) {
          finalReply += parsed.chunk;
          if (onChunk) onChunk(finalReply, parsed.chunk);
        }
        if (parsed.type === "done") {
          finalReply = parsed.reply || finalReply;
          if (onChunk) onChunk(finalReply, "");
        }
      } catch (error) {
        // Ignore malformed stream events.
      }
    }
  }

  return finalReply;
};

const NpcService = {
  getHistory,
  chatStream,
};

export default NpcService;
