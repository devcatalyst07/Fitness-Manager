"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

let globalSocket: Socket | null = null;
let activeHookCount = 0;

/** Returns a singleton Socket.IO instance that authenticates via cookies. */
function getSocket(): Socket {
  if (!globalSocket) {
    globalSocket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      autoConnect: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    });

    globalSocket.on("connect_error", (err) => {
      console.warn("[Socket.IO] Connection error:", err.message);
    });
  }
  return globalSocket;
}

export interface UseSocketOptions {
  onNewMessage?: (message: any) => void;
  onConversationUpdated?: (data: { conversationId: string; lastMessage: any }) => void;
  onTypingStart?: (data: { conversationId: string; userId: string; userName: string }) => void;
  onTypingStop?: (data: { conversationId: string; userId: string }) => void;
  onMessageRead?: (data: { conversationId: string; userId: string }) => void;
}

export function useSocket(opts: UseSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  // Connect on mount, disconnect when no hooks are active
  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    activeHookCount++;
    if (!socket.connected) socket.connect();

    const handleNewMessage = (msg: any) => optsRef.current.onNewMessage?.(msg);
    const handleConvoUpdated = (data: any) => optsRef.current.onConversationUpdated?.(data);
    const handleTypingStart = (data: any) => optsRef.current.onTypingStart?.(data);
    const handleTypingStop = (data: any) => optsRef.current.onTypingStop?.(data);
    const handleMessageRead = (data: any) => optsRef.current.onMessageRead?.(data);

    socket.on("message:new", handleNewMessage);
    socket.on("conversation:updated", handleConvoUpdated);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);
    socket.on("message:read", handleMessageRead);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("conversation:updated", handleConvoUpdated);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      socket.off("message:read", handleMessageRead);

      activeHookCount--;
      // Disconnect when no component is using the socket
      if (activeHookCount <= 0) {
        activeHookCount = 0;
        socket.disconnect();
        globalSocket = null;
      }
    };
  }, []);

  const joinConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit("join:conversation", conversationId);
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit("leave:conversation", conversationId);
  }, []);

  const sendMessage = useCallback(
    (conversationId: string, text: string): Promise<any> => {
      return new Promise((resolve, reject) => {
        if (!socketRef.current?.connected) {
          return reject(new Error("Socket not connected"));
        }
        socketRef.current.emit(
          "message:send",
          { conversationId, text },
          (resp: any) => {
            if (resp?.ok) resolve(resp.message);
            else reject(new Error(resp?.error || "Send failed"));
          },
        );
      });
    },
    [],
  );

  const emitTypingStart = useCallback((conversationId: string) => {
    socketRef.current?.emit("typing:start", conversationId);
  }, []);

  const emitTypingStop = useCallback((conversationId: string) => {
    socketRef.current?.emit("typing:stop", conversationId);
  }, []);

  const markRead = useCallback((conversationId: string) => {
    socketRef.current?.emit("message:read", conversationId);
  }, []);

  return {
    socket: socketRef,
    joinConversation,
    leaveConversation,
    sendMessage,
    emitTypingStart,
    emitTypingStop,
    markRead,
  };
}
