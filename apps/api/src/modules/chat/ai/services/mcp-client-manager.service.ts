import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import type { createReactAgent } from '@langchain/langgraph/prebuilt';
import { AuthService } from '../../auth/service';
import { CHAT_CONSTANTS } from '../../shared/constants';

// Session MCP Client arayüzü
interface SessionMCPClient {
  client: MultiServerMCPClient;
  agent: ReturnType<typeof createReactAgent> | null;
  lastUsed: Date;
  authHeaders: Record<string, string>;
  selectedModel?: string | null;
}

/**
 * MCP Client'ları session bazında yöneten service
 * Session-based MCP client yönetimi, cleanup ve header management
 */
export class MCPClientManager {
  // Session client'ları saklamak için static map
  private static sessionClients = new Map<string, SessionMCPClient>();
  private static readonly maxClients = 50; // Memory limit
  private static readonly clientTTL = 30 * 60 * 1000; // 30 dakika

  /**
   * Session için auth headers oluşturur
   */
  private static async createAuthHeaders(sessionId: string): Promise<{
    headers: Record<string, string>;
    isAuthenticated: boolean;
    session: any;
  }> {
    const session = await AuthService.getSession(sessionId);
    
    const authHeaders: Record<string, string> = {};
    let isAuthenticated = false;

    if (session && session.accessToken) {
      authHeaders['Authorization'] = `Bearer ${session.accessToken}`;
      isAuthenticated = true;
      console.log(`🔐 Authenticated session found for ${sessionId}`);
    } else if (session && !session.accessToken) {
      console.log(`👤 Anonymous session found for ${sessionId}`);
    } else {
      console.log(`❌ No session found for ${sessionId}, will work as anonymous`);
    }

    return {
      headers: authHeaders,
      isAuthenticated,
      session,
    };
  }

  /**
   * MCP Client oluşturur
   */
  static async createMcpClient(authHeaders: Record<string, string>): Promise<MultiServerMCPClient> {
    return new MultiServerMCPClient({
      throwOnLoadError: true,
      prefixToolNameWithServerName: true,
      additionalToolNamePrefix: 'mcp',
      useStandardContentBlocks: true,
      mcpServers: {
        insurup: {
          transport: 'http',
          url: CHAT_CONSTANTS.MCP_URL,
          headers: authHeaders,
          reconnect: {
            enabled: true,
            maxAttempts: CHAT_CONSTANTS.MCP_RECONNECT_MAX_ATTEMPTS,
            delayMs: CHAT_CONSTANTS.MCP_RECONNECT_DELAY_MS,
          },
          automaticSSEFallback: false,
        },
      },
    });
  }

  /**
   * Session için client döndürür veya yeni oluşturur
   */
  static async getClientForSession(
    sessionId: string,
    selectedModel?: string | null,
    conversationId?: string,
    agentFactory?: (
      mcpClient: MultiServerMCPClient,
      selectedModel?: string | null,
      conversationId?: string,
    ) => Promise<ReturnType<typeof createReactAgent>>,
    requireAuth = true, // MCP işlemleri için auth gerekip gerekmediği
  ): Promise<SessionMCPClient> {
    // Auth headers ve session durumunu al
    const authResult = await this.createAuthHeaders(sessionId);
    
    // Auth gerekli ama kullanıcı authenticated değilse
    if (requireAuth && !authResult.isAuthenticated) {
      throw new Error('Bu işlem için giriş yapmanız gerekli. Lütfen önce giriş yapın.');
    }

    const { headers: authHeaders, session } = authResult;

    // Mevcut client'ı kontrol et
    const existingClient = this.sessionClients.get(sessionId);
    if (existingClient) {
      // Headers değişmiş mi kontrol et
      if (this.areHeadersSame(existingClient.authHeaders, authHeaders)) {
        // Model değişmiş mi kontrol et
        if (existingClient.selectedModel === selectedModel) {
          // Client hala geçerli, last used zamanını güncelle
          existingClient.lastUsed = new Date();
          return existingClient;
        }
      }

      // Headers veya model değişmiş, eski client'ı kapat
      try {
        await existingClient.client.close();
      } catch (error) {
        console.warn('Eski client kapatma hatası:', error);
      }
      this.sessionClients.delete(sessionId);
    }

    // Yeni client oluştur
    const mcpClient = await this.createMcpClient(authHeaders);

    // Agent factory olmadan client oluşturma
    if (!agentFactory) {
      const sessionClient: SessionMCPClient = {
        client: mcpClient,
        agent: null, // Agent daha sonra set edilecek
        lastUsed: new Date(),
        authHeaders,
        selectedModel,
      };

      this.sessionClients.set(sessionId, sessionClient);
      return sessionClient;
    }

    // Agent oluştur
    const agent = await agentFactory(mcpClient, selectedModel, conversationId);

    const sessionClient: SessionMCPClient = {
      client: mcpClient,
      agent,
      lastUsed: new Date(),
      authHeaders,
      selectedModel,
    };

    // Session client'ı sakla
    this.sessionClients.set(sessionId, sessionClient);

    // Client limitini kontrol et ve eski client'ları temizle
    await this.cleanupExpiredClients();

    return sessionClient;
  }

  /**
   * Headers'ları karşılaştırır
   */
  static areHeadersSame(
    headers1: Record<string, string>,
    headers2: Record<string, string>,
  ): boolean {
    const keys1 = Object.keys(headers1);
    const keys2 = Object.keys(headers2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      if (headers1[key] !== headers2[key]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Session client'ı günceller (agent set etmek için)
   */
  static setAgentForSession(sessionId: string, agent: ReturnType<typeof createReactAgent>): void {
    const client = this.sessionClients.get(sessionId);
    if (client) {
      client.agent = agent;
    }
  }

  /**
   * Expired client'ları temizler
   */
  static async cleanupExpiredClients(): Promise<void> {
    const now = new Date();
    const clientsToRemove: string[] = [];

    // TTL'i geçen client'ları bul
    for (const [sessionId, client] of this.sessionClients.entries()) {
      if (now.getTime() - client.lastUsed.getTime() > this.clientTTL) {
        clientsToRemove.push(sessionId);
      }
    }

    // Client sayısı limit'i aştıysa, en eski client'ları bul
    if (this.sessionClients.size > this.maxClients) {
      const sortedClients = Array.from(this.sessionClients.entries()).sort(
        (a, b) => a[1].lastUsed.getTime() - b[1].lastUsed.getTime(),
      );

      const excessCount = this.sessionClients.size - this.maxClients;
      for (let i = 0; i < excessCount && i < sortedClients.length; i++) {
        const sessionEntry = sortedClients[i];
        if (sessionEntry) {
          const [sessionId] = sessionEntry;
          if (!clientsToRemove.includes(sessionId)) {
            clientsToRemove.push(sessionId);
          }
        }
      }
    }

    // Client'ları kapat ve Map'ten çıkar
    for (const sessionId of clientsToRemove) {
      const client = this.sessionClients.get(sessionId);
      if (client) {
        try {
          await client.client.close();
        } catch (error) {
          console.warn(`Client kapatma hatası (${sessionId}):`, error);
        }
        this.sessionClients.delete(sessionId);
      }
    }

    console.log(`Temizlenen client sayısı: ${clientsToRemove.length}`);
  }

  /**
   * Session client'ı yeniler
   */
  static async refreshSessionClient(sessionId: string): Promise<void> {
    const client = this.sessionClients.get(sessionId);
    if (client) {
      try {
        await client.client.close();
      } catch (error) {
        console.warn('Client kapatma hatası:', error);
      }
      this.sessionClients.delete(sessionId);
    }
  }

  /**
   * Tüm client'ları kapatır
   */
  static async closeAllClients(): Promise<void> {
    console.log("Tüm MCP client'ları kapatılıyor...");

    const closePromises = Array.from(this.sessionClients.values()).map(async (client) => {
      try {
        await client.client.close();
      } catch (error) {
        console.warn('Client kapatma hatası:', error);
      }
    });

    await Promise.all(closePromises);
    this.sessionClients.clear();
    console.log("Tüm MCP client'ları kapatıldı.");
  }

  /**
   * Client istatistiklerini döndürür
   */
  static getStatistics(): {
    totalSessions: number;
    maxClients: number;
    clientTTL: number;
  } {
    return {
      totalSessions: this.sessionClients.size,
      maxClients: this.maxClients,
      clientTTL: this.clientTTL,
    };
  }

  /**
   * Belirli bir session'ın client'ını döndürür
   */
  static getSessionClient(sessionId: string): SessionMCPClient | undefined {
    return this.sessionClients.get(sessionId);
  }

  /**
   * Session'ın var olup olmadığını kontrol eder
   */
  static hasSession(sessionId: string): boolean {
    return this.sessionClients.has(sessionId);
  }
}
