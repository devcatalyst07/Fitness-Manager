"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Send,
  Users,
} from "lucide-react";
import type { ConversationData, MessageData } from "@/services/messageService";
import { getConversationName } from "./ConversationList";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatMessageTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  "bg-blue-600",
  "bg-green-600",
  "bg-purple-600",
  "bg-orange-500",
  "bg-pink-600",
  "bg-teal-600",
  "bg-indigo-600",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface ChatAreaProps {
  conversation: ConversationData;
  messages: MessageData[];
  currentUserId: string;
  messageInput: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  typingUsers: string[];
  loadingMessages: boolean;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ChatArea({
  conversation,
  messages,
  currentUserId,
  messageInput,
  onInputChange,
  onSend,
  onTypingStart,
  onTypingStop,
  typingUsers,
  loadingMessages,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const displayName = getConversationName(conversation, currentUserId);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!messageInput.trim()) return;
    onSend();
    // Stop typing indicator on send
    if (isTyping) {
      setIsTyping(false);
      onTypingStop();
    }
  };

  const handleInputChange = useCallback(
    (value: string) => {
      onInputChange(value);

      if (value.trim() && !isTyping) {
        setIsTyping(true);
        onTypingStart();
      }

      // Reset stop timer
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        onTypingStop();
      }, 2000);
    },
    [isTyping, onInputChange, onTypingStart, onTypingStop],
  );

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
              conversation.type === "group"
                ? "bg-gray-400 dark:bg-gray-600"
                : getAvatarColor(displayName)
            }`}
          >
            {conversation.type === "group" ? (
              <Users size={18} />
            ) : (
              getInitials(displayName)
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {displayName}
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {conversation.type === "group"
                ? `${conversation.participants.length} members`
                : "Direct message"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <Phone size={20} />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <Video size={20} />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50 dark:bg-gray-950">
        {loadingMessages && (
          <div className="text-center text-sm text-gray-400 py-8">
            Loading messages...
          </div>
        )}

        {!loadingMessages && messages.length === 0 && (
          <div className="text-center text-sm text-gray-400 py-8">
            No messages yet. Start the conversation!
          </div>
        )}

        {messages.map((msg) => {
          const senderId =
            typeof msg.senderId === "object" ? msg.senderId._id : msg.senderId;
          const senderName =
            typeof msg.senderId === "object" ? msg.senderId.name : "Unknown";
          const isMe = senderId === currentUserId;

          return (
            <div
              key={msg._id}
              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
            >
              {!isMe && (
                <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 ml-1">
                  {senderName}
                </span>
              )}
              <div
                className={`max-w-md lg:max-w-lg px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMe
                    ? "bg-blue-600 text-white rounded-br-md"
                    : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-md"
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 mx-1">
                {formatMessageTime(msg.createdAt)}
              </span>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-start">
            <span className="text-xs text-blue-500 dark:text-blue-400 italic ml-1">
              {typingUsers.join(", ")}{" "}
              {typingUsers.length === 1 ? "is" : "are"} typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <Paperclip size={20} />
          </button>

          <div className="flex-1">
            <input
              type="text"
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <Smile size={20} />
          </button>

          <button
            onClick={handleSend}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors disabled:opacity-50"
            disabled={!messageInput.trim()}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
