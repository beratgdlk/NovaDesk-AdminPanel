import { Elysia } from 'elysia';
import { AgentsService } from '#modules/agents/service.ts';
import { AuthService } from '../auth/service';
import { CHAT_ERRORS, CHAT_MESSAGES } from '../shared/constants';
import { WebSocketService } from './service';

export const websocketController = new Elysia().ws('/ws', {
  async open(ws) {
    // Session ID'yi cookie'den al
    let sessionId = ws.data?.cookie?.chatSessionId?.value;

    if (!sessionId) {
      // WebSocket için yeni anonymous session oluştur (cookie set etmek mümkün değil)
      const request = ws.data?.request;
      const agent = await AgentsService.showByDomain(request);
      sessionId = await AuthService.createAnonymousSession(agent);
      console.warn(
        'WebSocket connection without session, created new anonymous session:',
        sessionId,
      );
    }

    try {
      // WebSocket connection'ını kaydet
      WebSocketService.addConnection(sessionId, ws);

      // Welcome message gönder
      const welcomeMessage = {
        type: 'system' as const,
        payload: {
          message: CHAT_MESSAGES.CONNECTION_ESTABLISHED,
          timestamp: new Date().toISOString(),
        },
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      };

      ws.send(JSON.stringify(welcomeMessage));
    } catch (error) {
      console.error('WebSocket open error:', error);
      ws.close(4002, 'WebSocket initialization failed');
    }
  },

  async message(ws, message) {
    // Session ID'yi cookie'den al
    let sessionId = ws.data?.cookie?.chatSessionId?.value;
    const request = ws.data?.request;
    const domain = new URL(request.url).hostname;

    if (!sessionId) {
      // WebSocket için yeni session oluştur (cookie set etmek mümkün değil)
      const agent = await AgentsService.showByDomain(domain);
      sessionId = await AuthService.createSession(agent);
      console.warn('WebSocket message without session, created new session:', sessionId);
    }

    try {
      const parsedMessage = typeof message === 'string' ? JSON.parse(message) : message;
      await WebSocketService.handleMessage(parsedMessage, sessionId, ws, domain);
    } catch (error) {
      console.error('WebSocket message error:', error);

      // Error response gönder
      const errorResponse = {
        type: 'error_response' as const,
        payload: {
          error: CHAT_ERRORS.WS_MESSAGE_PROCESSING_ERROR,
          code: 'WS_MESSAGE_ERROR',
          message: 'Mesaj işlenirken hata oluştu',
        },
        requestId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      };

      ws.send(JSON.stringify(errorResponse));
    }
  },

  close(ws) {
    // Session ID'yi cookie'den al
    const sessionId = ws.data?.cookie?.chatSessionId?.value;

    if (sessionId) {
      WebSocketService.removeConnection(sessionId);
    }
  },
});
