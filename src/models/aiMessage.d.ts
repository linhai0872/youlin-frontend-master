// models/aiMessage.d.ts
export interface AiMessage {
  id: number;
  conversationId: string; // 改为 string
  userId: number;
  senderType: number;
  content: string;
  modelId?: string;
  prompt?: string;
  createTime: Date;
  updateTime: Date;
  isDelete: number;
}

export interface AiConversationVO {
  conversationId: string; // 改为 string
  lastMessageTime: Date;
  lastMessage: string;
  messages: AiMessage[];
}

export interface AiMessageSendRequest {
  conversationId: string; // 改为 string
  content: string;
  modelId?: string;
  prompt?: string;
}