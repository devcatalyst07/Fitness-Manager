"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/hooks/useSocket";
import messageService, {
  ConversationData,
  MessageData,
  MessageMember,
} from "@/services/messageService";
import ConversationList from "./ConversationList";
import ChatArea from "./ChatArea";
import CreateGroupModal from "./CreateGroupModal";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function MessagesPanel() {
  const { user } = useAuth();
  const currentUserId = user?.id ?? "";

  // ── Data state ──────────────────────────────────────────────────
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [members, setMembers] = useState<MessageMember[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // ── UI state ────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  // typingMap: conversationId → userName
  const [typingMap, setTypingMap] = useState<Record<string, string>>({});

  // ── Socket ──────────────────────────────────────────────────────
  const {
    joinConversation,
    leaveConversation,
    sendMessage: socketSend,
    emitTypingStart,
    emitTypingStop,
    markRead,
  } = useSocket({
    onNewMessage: (msg: MessageData) => {
      // Append to active conversation
      if (msg.conversationId === activeConversationId) {
        setMessages((prev) => [...prev, msg]);
        markRead(msg.conversationId);
      }
      // Re-fetch conversation list to update last message & unread
      fetchConversations();
    },
    onConversationUpdated: () => {
      fetchConversations();
    },
    onTypingStart: ({ conversationId, userName }) => {
      setTypingMap((prev) => ({ ...prev, [conversationId]: userName }));
    },
    onTypingStop: ({ conversationId }) => {
      setTypingMap((prev) => {
        const next = { ...prev };
        delete next[conversationId];
        return next;
      });
    },
  });

  // ── Fetch conversations + members on mount ──────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      const data = await messageService.getConversations();
      setConversations(data);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    messageService.getMembers().then(setMembers).catch(console.error);
  }, [fetchConversations]);

  // ── Join/leave socket rooms when active conversation changes ────
  useEffect(() => {
    if (!activeConversationId) return;

    joinConversation(activeConversationId);
    markRead(activeConversationId);

    // Load messages
    setLoadingMessages(true);
    messageService
      .getMessages(activeConversationId)
      .then((res) => setMessages(res.messages))
      .catch(console.error)
      .finally(() => setLoadingMessages(false));

    return () => {
      leaveConversation(activeConversationId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId]);

  // ── Handlers ────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = messageInput.trim();
    if (!text || !activeConversationId) return;
    setMessageInput("");

    try {
      await socketSend(activeConversationId, text);
    } catch {
      // Fallback to REST if socket fails
      try {
        const msg = await messageService.sendMessage(
          activeConversationId,
          text,
        );
        setMessages((prev) => [...prev, msg]);
      } catch (err) {
        console.error("Send message failed:", err);
      }
    }
    fetchConversations();
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    // Clear unread locally for immediate feedback
    setConversations((prev) =>
      prev.map((c) => (c._id === id ? { ...c, unreadCount: 0 } : c)),
    );
  };

  const handleStartDirect = async (targetUserId: string) => {
    try {
      const convo = await messageService.getOrCreateDirect(targetUserId);
      await fetchConversations();
      setActiveConversationId(convo._id);
    } catch (err) {
      console.error("Failed to start direct conversation:", err);
    }
  };

  const handleCreateGroup = async (
    name: string,
    participantIds: string[],
  ) => {
    try {
      const convo = await messageService.createGroup(name, participantIds);
      await fetchConversations();
      setActiveConversationId(convo._id);
    } catch (err) {
      console.error("Failed to create group:", err);
    }
  };

  const activeConversation = conversations.find(
    (c) => c._id === activeConversationId,
  );

  const activeTypingUsers = activeConversationId
    ? Object.entries(typingMap)
        .filter(([cid]) => cid === activeConversationId)
        .map(([, name]) => name)
    : [];

  // ── Render ──────────────────────────────────────────────────────
  return (
    <>
      <div className="flex h-full bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Left sidebar */}
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          currentUserId={currentUserId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectConversation={handleSelectConversation}
          onNewChat={() => setShowNewChat(true)}
          typingMap={typingMap}
        />

        {/* Right panel */}
        {activeConversation ? (
          <ChatArea
            conversation={activeConversation}
            messages={messages}
            currentUserId={currentUserId}
            messageInput={messageInput}
            onInputChange={setMessageInput}
            onSend={handleSend}
            onTypingStart={() =>
              activeConversationId &&
              emitTypingStart(activeConversationId)
            }
            onTypingStop={() =>
              activeConversationId &&
              emitTypingStop(activeConversationId)
            }
            typingUsers={activeTypingUsers}
            loadingMessages={loadingMessages}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Select a conversation
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Choose a conversation from the sidebar to start messaging.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* New conversation / group modal */}
      <CreateGroupModal
        isOpen={showNewChat}
        onClose={() => setShowNewChat(false)}
        members={members}
        onCreateGroup={handleCreateGroup}
        onStartDirect={handleStartDirect}
      />
    </>
  );
}
