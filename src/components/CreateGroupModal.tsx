"use client";

import React, { useState } from "react";
import { X, Search, Users, Check } from "lucide-react";
import type { MessageMember } from "@/services/messageService";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

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

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: MessageMember[];
  onCreateGroup: (name: string, participantIds: string[]) => Promise<void>;
  /** Start a direct 1:1 conversation */
  onStartDirect: (userId: string) => Promise<void>;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CreateGroupModal({
  isOpen,
  onClose,
  members,
  onCreateGroup,
  onStartDirect,
}: CreateGroupModalProps) {
  const [mode, setMode] = useState<"choose" | "direct" | "group">("choose");
  const [groupName, setGroupName] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  if (!isOpen) return null;

  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleMember = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleCreate = async () => {
    if (mode === "group") {
      if (!groupName.trim() || selectedIds.length < 1) return;
      setCreating(true);
      await onCreateGroup(groupName.trim(), selectedIds);
      setCreating(false);
    }
    resetAndClose();
  };

  const handleDirect = async (userId: string) => {
    setCreating(true);
    await onStartDirect(userId);
    setCreating(false);
    resetAndClose();
  };

  const resetAndClose = () => {
    setMode("choose");
    setGroupName("");
    setSelectedIds([]);
    setSearch("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={resetAndClose}
      />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {mode === "choose"
              ? "New Conversation"
              : mode === "direct"
                ? "Direct Message"
                : "Create Group Chat"}
          </h3>
          <button
            onClick={resetAndClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode chooser */}
        {mode === "choose" && (
          <div className="p-5 space-y-3">
            <button
              onClick={() => setMode("direct")}
              className="w-full flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users size={20} className="text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  Direct Message
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Start a 1-on-1 conversation
                </div>
              </div>
            </button>
            <button
              onClick={() => setMode("group")}
              className="w-full flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Users size={20} className="text-purple-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  Group Chat
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Create a conversation with multiple members
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Direct or Group member selection */}
        {(mode === "direct" || mode === "group") && (
          <>
            {mode === "group" && (
              <div className="px-5 pt-4">
                <input
                  type="text"
                  placeholder="Group name..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>
            )}

            {/* Search */}
            <div className="px-5 pt-3">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>
            </div>

            {/* Member list */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1">
              {filtered.length === 0 && (
                <div className="text-center text-sm text-gray-400 py-4">
                  No team members found
                </div>
              )}
              {filtered.map((member) => {
                const isSelected = selectedIds.includes(member._id);
                return (
                  <button
                    key={member._id}
                    onClick={() =>
                      mode === "direct"
                        ? handleDirect(member._id)
                        : toggleMember(member._id)
                    }
                    disabled={creating}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isSelected && mode === "group"
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold ${getAvatarColor(member.name)}`}
                    >
                      {getInitials(member.name)}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {member.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {member.email}
                      </div>
                    </div>
                    {mode === "group" && isSelected && (
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                        <Check size={14} className="text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Group create button */}
            {mode === "group" && (
              <div className="p-5 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleCreate}
                  disabled={
                    creating || !groupName.trim() || selectedIds.length < 1
                  }
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {creating
                    ? "Creating..."
                    : `Create Group (${selectedIds.length} selected)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
