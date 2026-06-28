import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../config/env";

/**
 * @param {Record<string, Function>} handlers
 * @param {object} [options]
 * @param {boolean} [options.enabled=true]
 */
const useSocket = (handlers = {}, { enabled = true } = {}) => {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled) return undefined;

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      auth: { token: localStorage.getItem("accessToken") || "" },
    });

    const entries = Object.entries(handlersRef.current || {});
    entries.forEach(([event, handler]) => {
      if (typeof handler === "function") socket.on(event, handler);
    });

    return () => {
      entries.forEach(([event, handler]) => {
        if (typeof handler === "function") socket.off(event, handler);
      });
      socket.disconnect();
    };
  }, [enabled]);

  return null;
};

export default useSocket;
