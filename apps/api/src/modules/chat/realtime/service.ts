import { ChatService } from '../conversation/service';
import type {
  ElysiaWebSocket,
  WebSocketChatMessagePayload,
  WebSocketConversationHistoryPayload,
  WebSocketErrorPayload,
  WebSocketMessage,
  WebSocketResponse,
  WebSocketSession,
  WebSocketTypingPayload,
} from './types';

// Active connections map'i modül seviyesinde static
const activeConnections: Map<string, WebSocketSession> = new Map();

export abstract class WebSocketService {
  /**
   * WebSocket hatası oluşturur
   */
  private static createWebSocketError(
    error: string,
    code: string,
    message: string,
  ): WebSocketErrorPayload {
    return {
      error,
      code,
      message,
    };
  }

  /**
   * Typing indicator gönderir
   */
  static sendTypingIndicator(sessionId: string, conversationId: string, isTyping: boolean): void {
    const typingPayload: WebSocketTypingPayload = {
      isTyping,
      conversationId,
    };

    const response: WebSocketResponse = {
      type: 'typing_response',
      payload: typingPayload,
      timestamp: new Date().toISOString(),
    };

    WebSocketService.sendToSession(sessionId, response);
  }

  /**
   * Typing mesajını işler
   */
  private static handleTyping(message: WebSocketMessage, sessionId: string): WebSocketResponse {
    const payload = message.payload as WebSocketTypingPayload;

    // Typing indicator'ı diğer kullanıcılara broadcast et
    // Burada gerektiğinde broadcast logic'i implement edilebilir

    return {
      type: 'typing_response',
      payload: payload,
      requestId: message.requestId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * WebSocket mesajını işler
   */
  static async handleMessage(
    message: WebSocketMessage,
    sessionId: string,
    ws: ElysiaWebSocket,
    domain: string,
  ): Promise<void> {
    try {
      let response: WebSocketResponse;

      switch (message.type) {
        case 'chat_message': {
          response = await WebSocketService.handleChatMessage(message, sessionId, domain);
          break;
        }
        case 'conversation_history': {
          response = await WebSocketService.handleConversationHistory(message, sessionId);
          break;
        }
        case 'conversation_list': {
          response = await WebSocketService.handleConversationList(message, sessionId);
          break;
        }
        case 'typing': {
          response = WebSocketService.handleTyping(message, sessionId);
          break;
        }
        case 'ping': {
          response = WebSocketService.handlePing(message);
          break;
        }
        case 'pong': {
          response = WebSocketService.handlePong(message);
          break;
        }
        default: {
          const errorPayload = WebSocketService.createWebSocketError(
            'Unknown message type',
            'UNKNOWN_MESSAGE_TYPE',
            'Bilinmeyen mesaj tipi',
          );
          response = {
            type: 'error_response',
            payload: errorPayload,
            requestId: message.requestId,
            timestamp: new Date().toISOString(),
          };
        }
      }

      ws.send(JSON.stringify(response));
    } catch (error) {
      const errorPayload = WebSocketService.createWebSocketError(
        error instanceof Error ? error.message : 'Unknown error',
        'WEBSOCKET_ERROR',
        'WebSocket hatası oluştu',
      );

      const errorResponse: WebSocketResponse = {
        type: 'error_response',
        payload: errorPayload,
        requestId: message.requestId,
        timestamp: new Date().toISOString(),
      };

      ws.send(JSON.stringify(errorResponse));
    }
  }

  /**
   * Chat mesajı isteğini işler - ConversationService'e delegate eder
   */
  private static async handleChatMessage(
    message: WebSocketMessage,
    sessionId: string,
    domain: string,
  ): Promise<WebSocketResponse> {
    const payload = message.payload as WebSocketChatMessagePayload;

    if (!payload) {
      throw new Error('Payload gerekli');
    }

    // ConversationService'e delegate et
    const chatResponse = await ChatService.handleWebSocketMessage(
      payload.message,
      payload.conversationId ?? undefined,
      payload.selectedModel ?? undefined,
      sessionId,
      domain,
    );

    return {
      type: 'chat_response',
      payload: chatResponse,
      requestId: message.requestId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Konuşma geçmişi isteğini işler - ConversationService'e delegate eder
   */
  private static async handleConversationHistory(
    message: WebSocketMessage,
    sessionId: string,
  ): Promise<WebSocketResponse> {
    const payload = message.payload as WebSocketConversationHistoryPayload;

    if (!payload) {
      throw new Error('Payload gerekli');
    }

    // ConversationService'e delegate et
    const history = await ChatService.handleWebSocketConversationHistory(
      payload.conversationId,
      sessionId,
      payload.limit,
    );

    return {
      type: 'conversation_history_response',
      payload: history,
      requestId: message.requestId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Konuşma listesi isteğini işler - ConversationService'e delegate eder
   */
  private static async handleConversationList(
    message: WebSocketMessage,
    sessionId: string,
  ): Promise<WebSocketResponse> {
    // ConversationService'e delegate et
    const conversationList = await ChatService.handleWebSocketConversationList(sessionId);

    return {
      type: 'conversation_list_response',
      payload: conversationList,
      requestId: message.requestId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Ping mesajını işler
   */
  private static handlePing(message: WebSocketMessage): WebSocketResponse {
    return {
      type: 'pong',
      payload: { timestamp: new Date().toISOString() },
      requestId: message.requestId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Pong mesajını işler
   */
  private static handlePong(message: WebSocketMessage): WebSocketResponse {
    return {
      type: 'ping',
      payload: { timestamp: new Date().toISOString() },
      requestId: message.requestId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * WebSocket bağlantısını ekler
   */
  static addConnection(sessionId: string, ws: ElysiaWebSocket): void {
    const session: WebSocketSession = {
      sessionId,
      ws,
      conversationParticipantSession: {
        sessionId,
        isAuthenticated: false,
        createdAt: new Date(),
        lastActivity: new Date(),
      },
      lastActivity: new Date(),
    };
    activeConnections.set(sessionId, session);
  }

  /**
   * WebSocket bağlantısını kaldırır
   */
  static removeConnection(sessionId: string): void {
    const session = activeConnections.get(sessionId);
    if (session?.heartbeatInterval) {
      clearInterval(session.heartbeatInterval);
    }
    activeConnections.delete(sessionId);
  }

  /**
   * Aktif bağlantı sayısını döndürür
   */
  static getActiveConnectionCount(): number {
    return activeConnections.size;
  }

  /**
   * Belirli bir session'a mesaj gönderir
   */
  static sendToSession(sessionId: string, message: WebSocketResponse): void {
    const session = activeConnections.get(sessionId);
    if (session) {
      try {
        session.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('WebSocket send error:', error);
        // Bağlantı kapalıysa session'ı temizle
        WebSocketService.removeConnection(sessionId);
      }
    }
  }

  /**
   * Tüm aktif bağlantılara mesaj gönderir
   */
  static broadcast(message: WebSocketResponse): void {
    activeConnections.forEach((session, sessionId) => {
      try {
        session.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('WebSocket broadcast error:', error);
        // Bağlantı kapalıysa session'ı temizle
        WebSocketService.removeConnection(sessionId);
      }
    });
  }
}
