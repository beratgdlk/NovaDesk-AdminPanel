import type { UIMessage } from 'ai';

// Chat Types
export interface ChatMessage {
  message: string;
  conversationId?: string | null;
  selectedModel?: string | null;
}

export interface ChatResponse {
  conversationId: string;
  messages: UIMessage[];
  // Logout sonrası yeni session bilgileri
  newSessionId?: string;
  sessionUpdated?: boolean;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  type: 'function';
  status?: 'executing' | 'completed' | 'error' | 'failed';
  hasArguments?: boolean;
  error?: string;
}

export interface ToolResult {
  id: string;
  name: string;
  result: any;
  status: 'completed' | 'error';
  arguments: Record<string, unknown>;
  error?: string;
}

// Execution sırasında argümanların stream edilmesi için kullanılan tip
export interface ExecutionArgument {
  sessionId: string;
  toolName: string;
  arguments: Record<string, unknown>;
  timestamp: number;
  status?: 'executing' | 'completed' | 'error';
  error?: string;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  // Tool call'ları için tekrar eden tanımlar kaldırıldı, merkezi tipler kullanılıyor
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  // Frontend'de conditional rendering için kullanılacak
  isHidden?: boolean;
}

export interface ConversationHistory {
  conversationId: string;
  messages: UIMessage[];
  totalMessages: number;
  hasMore: boolean;
}

export interface ConversationListItem {
  conversationId: string;
  title: string;
  lastMessage: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationList {
  conversations: ConversationListItem[];
  total: number;
}

// Chat modülü uyumlu alias
export type ConversationListResponse = ConversationList;

export interface ChatError {
  error: string;
  code: string;
  message: string;
  timestamp: string;
}

// Additional types for service layer
export interface ConversationHistoryRequest {
  conversationId: string;
  sessionId: string;
  limit?: number;
}

export interface ConversationMetadata {
  conversationId: string;
  title?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationData {
  conversationId: string;
  sessionId: string;
  messages: ConversationMessage[];
  metadata: ConversationMetadata;
}
