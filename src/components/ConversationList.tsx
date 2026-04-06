"use client";

import React from "react";
import { Search, Users } from "lucide-react";
import type { ConversationData } from "@/services/messageService";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  return "Yesterday";
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

interface ConversationListProps {
  conversations: ConversationData[];
  activeConversationId: string | null;
  currentUserId: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  typingMap: Record<string, string>;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ConversationList({
  conversations,
  activeConversationId,
  currentUserId,
  searchQuery,
  onSearchChange,
  onSelectConversation,
  onNewChat,
  typingMap,
}: ConversationListProps) {
  const filtered = conversations.filter((c) => {
    const displayName = getConversationName(c, currentUserId);
    return displayName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="w-80 shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Messages
        </h2>
        <button
          onClick={onNewChat}
          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          title="New group chat"
        >
          <Users size={20} />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-gray-400">
            No conversations yet
          </div>
        )}

        {filtered.map((convo) => {
          const isActive = convo._id === activeConversationId;
          const displayName = getConversationName(convo, currentUserId);
          const typing = typingMap[convo._id];
          const lastText =
            convo.lastMessage?.text ?? "No messages yet";

          return (
            <button
              key={convo._id}
              onClick={() => onSelectConversation(convo._id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                isActive
                  ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800 border-l-4 border-transparent"
              }`}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                    convo.type === "group"
                      ? "bg-gray-400 dark:bg-gray-600"
                      : getAvatarColor(displayName)
                  }`}
                >
                  {convo.type === "group" ? (
                    <Users size={18} />
                  ) : (
                    getInitials(displayName)
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-semibold truncate ${
                      isActive
                        ? "text-blue-700 dark:text-blue-300"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {displayName}
                  </span>
                  {convo.lastMessageAt && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap ml-2">
                      {formatTime(convo.lastMessageAt)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span
                    className={`text-xs truncate ${
                      typing
                        ? "text-blue-500 dark:text-blue-400 italic"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {typing ? `${typing} is typing...` : lastText}
                  </span>
                  {convo.unreadCount > 0 && (
                    <span className="ml-2 shrink-0 w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {convo.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Exported helper used by sibling components                          */
/* ------------------------------------------------------------------ */

export function getConversationName(
  convo: ConversationData,
  currentUserId: string,
): string {
  if (convo.type === "group") return convo.name || "Group Chat";
  const other = convo.participants.find((p) => p._id !== currentUserId);
  return other?.name || "Unknown";
}
