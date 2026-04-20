"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  ArrowLeft,
  ChevronDown,
  FileText,
  Image,
  Info,
  Paperclip,
  Search,
  Smile,
  Send,
  Users,
} from "lucide-react";
import messageService from "@/services/messageService";
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

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${bytes} B`;
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
  selectedFiles: File[];
  onInputChange: (value: string) => void;
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
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
  selectedFiles,
  onInputChange,
  onAddFiles,
  onRemoveFile,
  onSend,
  onTypingStart,
  onTypingStop,
  typingUsers,
  loadingMessages,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);
  const [isMediaFilesOpen, setIsMediaFilesOpen] = useState(false);
  const [mediaFilesView, setMediaFilesView] = useState<"menu" | "media" | "files">("menu");
  const [isSearchingConversation, setIsSearchingConversation] = useState(false);
  const [conversationSearchQuery, setConversationSearchQuery] = useState("");
  const [conversationSearchResults, setConversationSearchResults] = useState<MessageData[]>([]);
  const [conversationSearchLoading, setConversationSearchLoading] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  const displayName = getConversationName(conversation, currentUserId);
  const allSharedAttachments = messages.flatMap((msg) =>
    (msg.attachments || []).map((attachment) => ({
      ...attachment,
      sharedAt: msg.createdAt,
    })),
  );
  const sharedMedia = allSharedAttachments.filter((attachment) =>
    attachment.fileType?.startsWith("image/"),
  );
  const sharedFiles = allSharedAttachments.filter(
    (attachment) => !attachment.fileType?.startsWith("image/"),
  );

  const groupByMonth = <T extends { sharedAt: string }>(items: T[]) => {
    return items.reduce<Record<string, T[]>>((acc, item) => {
      const month = new Date(item.sharedAt).toLocaleString("en-US", {
        month: "long",
      });
      if (!acc[month]) acc[month] = [];
      acc[month].push(item);
      return acc;
    }, {});
  };

  const mediaByMonth = groupByMonth(sharedMedia);
  const filesByMonth = groupByMonth(sharedFiles);

  useEffect(() => {
    const query = conversationSearchQuery.trim();
    if (!isSearchingConversation || !query) {
      setConversationSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setConversationSearchLoading(true);
        const results = await messageService.searchConversationMessages(
          conversation._id,
          query,
        );
        setConversationSearchResults(results);
      } catch (error) {
        console.error("Conversation search failed:", error);
      } finally {
        setConversationSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [conversation._id, conversationSearchQuery, isSearchingConversation]);

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
    if (!messageInput.trim() && selectedFiles.length === 0) return;
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

  const handleToggleConversationSearch = () => {
    setIsSearchingConversation((prev) => {
      const next = !prev;
      if (!next) {
        setConversationSearchQuery("");
        setConversationSearchResults([]);
        setHighlightedMessageId(null);
      }
      return next;
    });
  };

  const handleClickSearchResult = (messageId: string) => {
    setHighlightedMessageId(messageId);
    
    // Scroll to the message
    setTimeout(() => {
      const messageElement = document.getElementById(`message-${messageId}`);
      if (messageElement && messagesContainerRef.current) {
        messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 0);

    // Clear highlight after 3 seconds
    setTimeout(() => {
      setHighlightedMessageId(null);
    }, 3000);
  };

  return (
    <div className="flex-1 flex bg-white dark:bg-gray-900">
      <div className="flex-1 flex flex-col min-w-0">
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
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/jpg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              onAddFiles(files);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => setIsInfoPanelOpen((prev) => !prev)}
            className={`p-2 rounded-lg transition-all duration-300 ease-out ${
              isInfoPanelOpen
                ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
            title="Chat details"
          >
            <Info size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50 dark:bg-gray-950">
        {isSearchingConversation && (
          <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-950 pb-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={conversationSearchQuery}
                onChange={(e) => setConversationSearchQuery(e.target.value)}
                placeholder="Search this conversation..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
              />
              <button
                onClick={handleToggleConversationSearch}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Close search"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            {conversationSearchQuery.trim() && (
              <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                {conversationSearchLoading ? (
                  <p className="px-3 py-2 text-xs text-gray-500">Searching...</p>
                ) : conversationSearchResults.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-gray-500">No matching messages.</p>
                ) : (
                  conversationSearchResults.map((result) => (
                    <div
                      key={result._id}
                      onClick={() => handleClickSearchResult(result._id)}
                      className="px-3 py-2 border-b last:border-b-0 border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
                        {result.text || "(Attachment)"}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-1">
                        {formatMessageTime(result.createdAt)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

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
              id={`message-${msg._id}`}
              className={`flex flex-col ${isMe ? "items-end" : "items-start"} transition-all ${
                highlightedMessageId === msg._id ? "bg-yellow-100/30 dark:bg-yellow-900/20 px-3 py-2 rounded-lg" : ""
              }`}
            >
              {!isMe && (
                <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 ml-1">
                  {senderName}
                </span>
              )}
              <div
                className={`max-w-md lg:max-w-lg px-4 py-2.5 rounded-2xl text-sm leading-relaxed transition-colors ${
                  highlightedMessageId === msg._id
                    ? "ring-2 ring-yellow-400 dark:ring-yellow-500"
                    : ""
                } ${
                  isMe
                    ? "bg-blue-600 text-white rounded-br-md"
                    : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-md"
                }`}
              >
                {msg.text}
                {msg.attachments?.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {msg.attachments.map((attachment) => (
                      <a
                        key={attachment.fileUrl}
                        href={attachment.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-left text-sm text-blue-700 hover:bg-blue-100"
                      >
                        <div className="font-medium">{attachment.fileName}</div>
                        <div className="text-xs text-blue-600">
                          {attachment.fileType} • {formatFileSize(attachment.fileSize)}
                        </div>
                      </a>
                    ))}
                  </div>
                )}
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
        {selectedFiles.length > 0 && (
          <div className="mb-3 space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${file.size}-${index}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                <div className="truncate">
                  <div className="font-medium truncate">{file.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveFile(index)}
                  className="text-red-500 hover:text-red-600 text-xs"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            className="p-2 text-gray-400 transition duration-200 ease-out hover:scale-110 hover:text-blue-600 dark:hover:text-blue-300"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
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
            disabled={!messageInput.trim() && selectedFiles.length === 0}
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      </div>

      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          isInfoPanelOpen ? "w-80 opacity-100" : "w-0 opacity-0"
        }`}
      >
        <aside
          className={`w-80 h-full border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 overflow-y-auto transition-transform duration-300 ease-out ${
            isInfoPanelOpen ? "translate-x-0" : "translate-x-6"
          }`}
        >
          {isMediaFilesOpen && mediaFilesView !== "menu" ? (
            <div className="pt-2">
              <div className="px-6 py-4 flex items-center gap-4">
                <button
                  onClick={() => setMediaFilesView("menu")}
                  className="text-gray-200 hover:text-white transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <h4 className="text-xl font-semibold text-gray-100">
                  Media and files
                </h4>
              </div>

              <div className="px-6 mt-2">
                <div className="flex items-center gap-8 border-b border-gray-700/60 mb-4">
                  <button
                    onClick={() => setMediaFilesView("media")}
                    className={`pb-2 text-lg font-semibold transition-colors ${
                      mediaFilesView === "media"
                        ? "text-blue-400 border-b-2 border-blue-500"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    Media
                  </button>
                  <button
                    onClick={() => setMediaFilesView("files")}
                    className={`pb-2 text-lg font-semibold transition-colors ${
                      mediaFilesView === "files"
                        ? "text-blue-400 border-b-2 border-blue-500"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    Files
                  </button>
                </div>

                {mediaFilesView === "media" ? (
                  Object.keys(mediaByMonth).length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      No shared media yet.
                    </p>
                  ) : (
                    <div className="space-y-4 pb-5">
                      {Object.entries(mediaByMonth).map(([month, items]) => (
                        <div key={month}>
                          <h4 className="text-lg font-semibold text-gray-100 mb-2">
                            {month}
                          </h4>
                          <div className="grid grid-cols-3 gap-2">
                            {items.map((attachment, index) => (
                              <a
                                key={`${attachment.fileUrl}-${index}`}
                                href={attachment.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="block rounded-lg overflow-hidden border border-gray-700"
                              >
                                <img
                                  src={attachment.fileUrl}
                                  alt={attachment.fileName}
                                  className="w-full h-20 object-cover"
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : Object.keys(filesByMonth).length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    No shared files yet.
                  </p>
                ) : (
                  <div className="space-y-4 pb-5">
                    {Object.entries(filesByMonth).map(([month, items]) => (
                      <div key={month}>
                        <h4 className="text-lg font-semibold text-gray-100 mb-2">
                          {month}
                        </h4>
                        <div className="space-y-2">
                          {items.map((attachment, index) => (
                            <a
                              key={`${attachment.fileUrl}-${index}`}
                              href={attachment.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="block rounded-lg border border-gray-700 p-2.5 hover:bg-gray-800 transition-colors"
                            >
                              <p className="text-sm font-medium text-gray-100 truncate">
                                {attachment.fileName}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {attachment.fileType} • {formatFileSize(attachment.fileSize)}
                              </p>
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="px-6 py-8 text-center border-b border-gray-200 dark:border-gray-700">
                <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xl font-bold text-gray-700 dark:text-gray-200">
                  {getInitials(displayName)}
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white leading-tight wrap-break-word">
                  {displayName}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {conversation.type === "group"
                    ? `${conversation.participants.length} members`
                    : "Direct message"}
                </p>

                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleToggleConversationSearch}
                    className="flex flex-col items-center gap-2 text-gray-700 dark:text-gray-200"
                  >
                    <span className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                      <Search size={22} />
                    </span>
                    <span className="text-sm font-medium">
                      {isSearchingConversation ? "Close Search" : "Search"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="py-2">
              <div>
                <button
                  onClick={() => {
                    setIsMediaFilesOpen((prev) => {
                      const next = !prev;
                      if (next) setMediaFilesView("menu");
                      return next;
                    });
                  }}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <span className="text-base font-semibold text-gray-100 dark:text-white">
                    Media & files
                  </span>
                  <ChevronDown
                    size={18}
                    className={`text-gray-300 transition-transform duration-200 ${
                      isMediaFilesOpen ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </button>

                {isMediaFilesOpen && mediaFilesView === "menu" && (
                  <div className="px-6 pb-5 space-y-3 pt-1">
                    <button
                      onClick={() => setMediaFilesView("media")}
                      className="w-full flex items-center gap-3 text-left text-gray-200 hover:text-white transition-colors"
                    >
                      <Image size={20} className="text-gray-300" />
                      <span className="text-lg font-semibold">Media</span>
                    </button>
                    <button
                      onClick={() => setMediaFilesView("files")}
                      className="w-full flex items-center gap-3 text-left text-gray-200 hover:text-white transition-colors"
                    >
                      <FileText size={20} className="text-gray-300" />
                      <span className="text-lg font-semibold">Files</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
