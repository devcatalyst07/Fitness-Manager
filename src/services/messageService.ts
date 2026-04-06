import { apiClient } from "@/lib/axios";

export interface MessageMember {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "user";
}

export interface MessageUser {
  _id: string;
  name: string;
  email: string;
}

export interface MessageData {
  _id: string;
  conversationId: string;
  senderId: MessageUser;
  text: string;
  attachments: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationData {
  _id: string;
  type: "direct" | "group";
  name?: string;
  participants: MessageUser[];
  adminId: string;
  createdBy: string;
  lastMessage?: {
    _id: string;
    text: string;
    senderId: { _id: string; name: string };
    createdAt: string;
  };
  lastMessageAt: string;
  unreadCount: number;
  createdAt: string;
}

export interface PaginatedMessages {
  messages: MessageData[];
  total: number;
  page: number;
  totalPages: number;
}

const messageService = {
  /** Get team members eligible for messaging (plan-capped). */
  async getMembers(): Promise<MessageMember[]> {
    return apiClient.get<MessageMember[]>("/api/messages/members");
  },

  /** Get all conversations for the current user. */
  async getConversations(): Promise<ConversationData[]> {
    return apiClient.get<ConversationData[]>("/api/messages/conversations");
  },

  /** Get or create a 1:1 direct conversation. */
  async getOrCreateDirect(targetUserId: string): Promise<ConversationData> {
    return apiClient.post<ConversationData>(
      "/api/messages/conversations/direct",
      { targetUserId },
    );
  },

  /** Create a group conversation. */
  async createGroup(
    name: string,
    participantIds: string[],
  ): Promise<ConversationData> {
    return apiClient.post<ConversationData>(
      "/api/messages/conversations/group",
      { name, participantIds },
    );
  },

  /** Get paginated messages for a conversation. */
  async getMessages(
    conversationId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<PaginatedMessages> {
    return apiClient.get<PaginatedMessages>(
      `/api/messages/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
    );
  },

  /** Send a message via REST (fallback when socket is unavailable). */
  async sendMessage(
    conversationId: string,
    text: string,
  ): Promise<MessageData> {
    return apiClient.post<MessageData>(
      `/api/messages/conversations/${conversationId}/messages`,
      { text },
    );
  },

  /** Mark all messages in a conversation as read. */
  async markAsRead(conversationId: string): Promise<void> {
    await apiClient.post(`/api/messages/conversations/${conversationId}/read`);
  },
};

export default messageService;
