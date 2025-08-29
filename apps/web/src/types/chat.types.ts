// Local minimal copies of backend conversation types
export type ConversationHistory = {
  messages: Array<{ id: string; role: 'user' | 'assistant'; parts: any[]; metadata?: any }>;
};

export type ConversationListItem = {
  conversationId: string;
  title: string;
  updatedAt: string | Date;
  lastMessage?: string;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  parts: any[];
  metadata?: any;
};

export type ToolCall = {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
};

export type ToolResult = {
  toolCallId: string;
  output: unknown;
  isError?: boolean;
};

import type { ThreadMessageLike } from '@assistant-ui/react';

// Unified conversation type - artık messages da içinde
export interface ConversationData {
  threadId: string; // Compat with existing UI - actually conversationId
  title?: string;
  status: 'regular' | 'archived';
  lastUpdated?: Date;
  messages: ThreadMessageLike[]; // ✅ Messages artık burada
}

export type StreamDataEvent =
  | { type: 'text-delta'; delta: string; data?: never }
  | { type: 'data-user_message'; data: UserMessageData; delta?: never }
  | { type: 'data-new_conversation'; data: NewConversationData; delta?: never }
  | { type: 'data-conversation_error'; data: ConversationErrorData; delta?: never }
  | { type: 'tool-input-start'; toolCallId: string; toolName?: string; data?: never; delta?: never }
  | { type: 'tool-input-available'; toolCallId: string; input?: Record<string, unknown>; data?: never; delta?: never }
  | { type: 'tool-output-available'; toolCallId: string; output?: string | Record<string, unknown>; data?: never; delta?: never }

export interface NewConversationData {
  conversationId: string;
  isNewConversation: boolean;
}

export interface ConversationErrorData {
  message: string;
  error: string;
}

export interface UserMessageData {
  messageId: string;
}
