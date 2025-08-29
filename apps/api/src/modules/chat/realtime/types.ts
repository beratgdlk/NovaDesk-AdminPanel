import type { ChatResponse, ConversationHistory, ConversationList } from '../conversation/types';

// WebSocket Payload Types
export interface WebSocketChatMessagePayload {
  message: string;
  conversationId?: string | null;
  selectedModel?: string | null;
}

export interface WebSocketConversationHistoryPayload {
  conversationId: string;
  limit?: number;
}

export interface WebSocketAuthStatusPayload {
  isAuthenticated: boolean;
  userId?: string;
  expiryMinutes?: number;
  shouldRefresh?: boolean;
}

export interface WebSocketErrorPayload {
  error: string;
  code: string;
  message: string;
}

export interface WebSocketTypingPayload {
  isTyping: boolean;
  conversationId: string;
}

export interface WebSocketPingPayload {
  timestamp: string;
}

export interface WebSocketPongPayload {
  timestamp: string;
}

// Union type for all possible payloads
export type WebSocketPayload =
  | WebSocketChatMessagePayload
  | WebSocketConversationHistoryPayload
  | WebSocketAuthStatusPayload
  | WebSocketErrorPayload
  | WebSocketTypingPayload
  | WebSocketPingPayload
  | WebSocketPongPayload
  | ChatResponse
  | ConversationHistory
  | ConversationList;

// WebSocket Types
export interface WebSocketMessage {
  type:
    | 'chat_message'
    | 'conversation_history'
    | 'conversation_list'
    | 'auth_status'
    | 'typing'
    | 'ping'
    | 'pong'
    | 'error';
  payload?: WebSocketPayload;
  requestId?: string;
  timestamp: string;
}

export interface WebSocketResponse {
  type:
    | 'chat_response'
    | 'conversation_history_response'
    | 'conversation_list_response'
    | 'auth_status_response'
    | 'typing_response'
    | 'ping'
    | 'pong'
    | 'error_response';
  payload: WebSocketPayload;
  requestId?: string;
  timestamp: string;
}

// Elysia WebSocket type - Bun's ServerWebSocket
export interface ElysiaWebSocket {
  send: (message: string) => void;
  close: (code?: number, reason?: string) => void;
  data?: {
    cookie?: {
      chatSessionId?: {
        value?: string;
      };
    };
  };
}

// Conversation Participant Session interface
export interface ConversationParticipantSession {
  sessionId: string;
  participantId?: string;
  userId?: string;
  isAuthenticated: boolean;
  createdAt: Date;
  lastActivity: Date;
}

export interface WebSocketSession {
  sessionId: string;
  ws: ElysiaWebSocket;
  conversationParticipantSession: ConversationParticipantSession;
  lastActivity: Date;
  heartbeatInterval?: NodeJS.Timeout;
  lastHeartbeat?: Date;
}

// Session Types
export interface SessionData {
  sessionId: string;
  userId?: string;
  agentId: number;
  agentUuid: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt: Date;
  accessTokenExpiresAt?: Date;
  refreshTokenExpiresAt?: Date;
  createdAt: Date;
}
