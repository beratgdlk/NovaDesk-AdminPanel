import type { Agent } from '@onlyjs/db/client';
import { AuthService } from '../../auth/service';

/**
 * Session geçerli değilse yeni session oluşturur ve session ID'yi döner
 * Streaming sırasında session recovery için kullanılır
 */
export async function handleSessionRecovery(
  sessionId: string,
  agent: Pick<Agent, 'id' | 'uuid'>,
): Promise<{
  isRecovered: boolean;
  sessionId: string;
  message?: string;
}> {
  try {
    // Mevcut session'ı kontrol et
    const session = await AuthService.getSession(sessionId);

    if (session) {
      // Session geçerli
      return {
        isRecovered: false,
        sessionId: sessionId,
      };
    }

    // Session not found - yeni session oluştur
    console.log(`🔄 Session recovery: Creating new session for invalid sessionId: ${sessionId}`);
    const newSessionId = await AuthService.createSession(agent);

    return {
      isRecovered: true,
      sessionId: newSessionId,
      message: `Session geçersiz olduğu için yeni session oluşturuldu`,
    };
  } catch (error) {
    console.error('Session recovery error:', error);

    // Hata durumunda da yeni session oluştur
    const newSessionId = await AuthService.createSession(agent);

    return {
      isRecovered: true,
      sessionId: newSessionId,
      message: `Session kontrol hatası nedeniyle yeni session oluşturuldu`,
    };
  }
}
