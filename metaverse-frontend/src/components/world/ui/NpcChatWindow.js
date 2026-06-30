import React, { useEffect, useRef, useState } from "react";
import { IoClose, IoSend } from "react-icons/io5";
import NpcService from "../../../services/npc.service";
import { ShowErrorMessage } from "../../common/Message";

const NpcChatWindow = ({ open, onClose }) => {
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [streamingReply, setStreamingReply] = useState("");
  const listRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    NpcService.getHistory().then(setHistory).catch(() => setHistory([]));
  }, [open]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [history, streamingReply, open]);

  const submit = async (event) => {
    event.preventDefault();
    const text = message.trim();
    if (!text || sending) return;

    setSending(true);
    setMessage("");
    setStreamingReply("");
    const nextHistory = [...history, { role: "user", content: text }, { role: "assistant", content: "" }];
    setHistory(nextHistory);

    try {
      await NpcService.chatStream({
        message: text,
        onChunk: (fullReply) => {
          setStreamingReply(fullReply);
          setHistory((current) => {
            const next = [...current];
            next[next.length - 1] = { role: "assistant", content: fullReply };
            return next;
          });
        },
      });
      setStreamingReply("");
    } catch (error) {
      ShowErrorMessage(error?.message || "NPC chat failed.");
      setHistory((current) => current.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <div className="pointer-events-auto fixed inset-x-4 bottom-4 z-40 mx-auto flex max-h-[70vh] w-[min(720px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-white/20 bg-slate-950/90 text-white shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-100">NPC Conversation</p>
          <h2 className="text-lg font-semibold">Astra</h2>
        </div>
        <button type="button" onClick={onClose} className="rounded-full p-2 text-white hover:bg-white/10">
          <IoClose className="h-5 w-5" />
        </button>
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {history.length === 0 && <p className="text-sm text-slate-300">Ask me anything about the world or your knowledge base.</p>}
        {history.map((item, index) => (
          <div key={`${item.role}-${index}`} className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${item.role === "user" ? "bg-cyan-500 text-slate-950" : "bg-white/10 text-white"}`}>
              {item.content || (index === history.length - 1 && sending ? "Thinking..." : "")}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="border-t border-white/10 p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={2}
            placeholder="Type your message..."
            className="min-h-[48px] flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={sending || !message.trim()}
            className="grid h-12 w-12 place-items-center rounded-xl bg-cyan-500 text-slate-950 disabled:opacity-50"
          >
            <IoSend className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default NpcChatWindow;
