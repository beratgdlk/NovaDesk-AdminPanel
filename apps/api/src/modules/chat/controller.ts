import { Elysia } from 'elysia';
import { AIService } from './ai';
import { authController } from './auth/controller';
import { AuthService } from './auth/service';
import { conversationController } from './conversation/controller';
import { proposalsCron } from './proposals/cron';
import { websocketController } from './realtime/controller';
import { CHAT_MESSAGES } from './shared/constants';

export const chatController = new Elysia({ prefix: '/chat' })
  .use(proposalsCron)
  .onStart(async () => {
    // Chat service'i başlat
    try {
      // AIService'i initialize et
      await AIService.initialize();
      console.log(CHAT_MESSAGES.CHAT_SERVICE_INITIALIZED);

      // Expired session'ları temizle
      await AuthService.cleanupExpiredSessions();
      console.log('🧹 Expired sessions cleaned up');
    } catch (error) {
      console.error(CHAT_MESSAGES.CHAT_SERVICE_INIT_FAILED, error);
    }
  })
  .onStop(async () => {
    // Chat service'i kapat
    try {
      await AIService.closeAllClients();
      console.log(CHAT_MESSAGES.CHAT_SERVICE_CLOSED);
    } catch (error) {
      console.error(CHAT_MESSAGES.CHAT_SERVICE_CLOSE_FAILED, error);
    }
  })
  // Sub-controller'ları compose et
  .use(authController)
  .use(conversationController)
  .use(websocketController);
