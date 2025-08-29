import prisma from '@onlyjs/db';
import type { Agent } from '@onlyjs/db/client';
import { NotFoundException } from '#utils/http-errors.ts';
import type { SessionData } from '../realtime/types';
import { CHAT_CONSTANTS, CHAT_ERRORS } from '../shared/constants';
import type {
  AuthStatus,
  LoginRequest,
  LoginResponse,
  MfaRequest,
  MfaResponse,
  UserProfile,
} from './types';

export abstract class AuthService {
  /**
   * Session oluşturur veya günceller
   */
  static async createSession(agent: Pick<Agent, 'id' | 'uuid'>, userId?: string): Promise<string> {
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(
      Date.now() + CHAT_CONSTANTS.SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );

    await prisma.conversationParticipantSession.create({
      data: {
        token: sessionId,
        userId: userId || null,
        agentId: agent.id,
        agentUuid: agent.uuid,
        expiresAt,
      },
    });

    return sessionId;
  }

  /**
   * Anonymous session oluşturur (userId olmadan)
   */
  static async createAnonymousSession(agent: Pick<Agent, 'id' | 'uuid'>): Promise<string> {
    console.log('🔄 Creating anonymous session...');
    const sessionId = await this.createSession(agent);
    console.log(`✅ Anonymous session created: ${sessionId}`);
    return sessionId;
  }

  /**
   * User session oluşturur (userId ile)
   */
  static async createUserSession(
    agent: Pick<Agent, 'id' | 'uuid'>,
    userId: string,
  ): Promise<string> {
    console.log(`🔄 Creating user session for userId: ${userId}`);
    const sessionId = await this.createSession(agent, userId);
    console.log(`✅ User session created: ${sessionId}`);
    return sessionId;
  }

  /**
   * Anonymous session'ı user session'a upgrade eder
   */
  static async upgradeSessionToUser(sessionId: string, userId: string): Promise<void> {
    console.log(`🔄 Upgrading session ${sessionId} to user ${userId}`);

    await prisma.conversationParticipantSession.update({
      where: {
        token: sessionId,
        deletedAt: null,
      },
      data: {
        userId,
      },
    });

    console.log(`✅ Session ${sessionId} upgraded to user ${userId}`);
  }

  /**
   * Session'a auth tokenları ekler (login sonrası)
   */
  static async addAuthTokensToSession(
    sessionId: string,
    accessToken: string,
    refreshToken?: string,
    accessTokenExpiresAt?: Date,
    refreshTokenExpiresAt?: Date,
  ): Promise<void> {
    console.log(`🔐 Adding auth tokens to session ${sessionId}`);

    await prisma.conversationParticipantSession.update({
      where: {
        token: sessionId,
        deletedAt: null,
      },
      data: {
        accessToken,
        refreshToken,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
      },
    });

    console.log(`✅ Auth tokens added to session ${sessionId}`);
  }

  /**
   * Session'ı getirir
   */
  static async getSession(sessionId: string): Promise<SessionData | null> {
    const session = await prisma.conversationParticipantSession.findUnique({
      where: {
        token: sessionId,
        deletedAt: null, // Soft delete'leri hariç tut
      },
    });

    if (!session) {
      console.log(`❌ Session not found or deleted: ${sessionId}`);
      return null;
    }

    // Session süresi kontrol et
    if (session.expiresAt && session.expiresAt < new Date()) {
      console.log(
        `⏰ Session expired: ${sessionId}, expiresAt=${session.expiresAt}, now=${new Date()}`,
      );
      // Session'ı hemen silme, conversation'ları korumak için
      // Cleanup job'a bırakıyoruz
      return null;
    }

    console.log(
      `✅ Session found and valid: ${sessionId}, expiresAt=${session.expiresAt}, userId=${session.userId}`,
    );
    return {
      sessionId: session.token,
      userId: session.userId || undefined,
      agentId: session.agentId,
      agentUuid: session.agentUuid,
      accessToken: session.accessToken || undefined,
      refreshToken: session.refreshToken || undefined,
      expiresAt: session.expiresAt,
      accessTokenExpiresAt: session.accessTokenExpiresAt || undefined,
      refreshTokenExpiresAt: session.refreshTokenExpiresAt || undefined,
      createdAt: session.createdAt,
    };
  }

  /**
   * Session'ı soft delete yapar
   * @param sessionId Session ID
   */
  static async deleteSession(sessionId: string): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        // Session'ı soft delete yap
        await tx.conversationParticipantSession.update({
          where: {
            token: sessionId,
            deletedAt: null, // Zaten silinmişse skip et
          },
          data: {
            deletedAt: new Date(),
          },
        });

        console.log(`🗑️  Session soft deleted: ${sessionId}`);
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('P2025')) {
        // Session bulunamadı, zaten silinmiş olabilir
        console.log(`⚠️  Session not found for soft delete: ${sessionId}`);
      } else {
        console.error(`❌ Error soft deleting session ${sessionId}:`, error);
        throw error;
      }
    }
  }

  /**
   * Session'ı hard delete yapar - conversation'ları koruyarak
   * @param sessionId Session ID
   */
  static async hardDeleteSession(sessionId: string): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        // 1. Önce bu session'a bağlı conversation'ları bul
        const conversations = await tx.conversation.findMany({
          where: {
            participantSessionId: sessionId,
            deletedAt: null,
          },
        });

        console.log(
          `🔍 Found ${conversations.length} conversations linked to session ${sessionId}`,
        );

        // 2. Conversation'ların session referanslarını null'a çek
        if (conversations.length > 0) {
          await tx.conversation.updateMany({
            where: {
              participantSessionId: sessionId,
              deletedAt: null,
            },
            data: {
              participantSessionId: null,
            },
          });

          console.log(`✅ Nullified session references for ${conversations.length} conversations`);
        }

        // 3. Session'ı hard delete yap
        await tx.conversationParticipantSession.delete({
          where: { token: sessionId },
        });

        console.log(`🗑️  Session hard deleted: ${sessionId}`);
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('P2025')) {
        // Session bulunamadı, zaten silinmiş olabilir
        console.log(`⚠️  Session not found for hard delete: ${sessionId}`);
      } else {
        console.error(`❌ Error hard deleting session ${sessionId}:`, error);
        throw error;
      }
    }
  }

  /**
   * Session'ı günceller
   */
  static async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<void> {
    await prisma.conversationParticipantSession.update({
      where: {
        token: sessionId,
        deletedAt: null, // Soft delete'leri hariç tut
      },
      data: {
        userId: updates.userId ?? undefined,
        accessToken: updates.accessToken ?? undefined,
        refreshToken: updates.refreshToken ?? undefined,
        expiresAt: updates.expiresAt ?? undefined,
        accessTokenExpiresAt: updates.accessTokenExpiresAt ?? undefined,
        refreshTokenExpiresAt: updates.refreshTokenExpiresAt ?? undefined,
      },
    });
  }

  /**
   * InsurUp API'sine login yapar
   */
  static async login(request: LoginRequest): Promise<LoginResponse> {
    try {
      const payload = {
        $type: 'individual',
        IdentityNumber: parseInt(request.identityNumber),
        PhoneNumber: {
          number: request.phoneNumber,
          countryCode: request.phoneCountryCode ?? CHAT_CONSTANTS.PHONE_DEFAULT_COUNTRY_CODE,
        },
        Birthdate: request.birthDate,
        AgentId: '9014e1ae-603c-4777-a597-82089b6d6fa2',
      };

      const response = await fetch(
        `${CHAT_CONSTANTS.INSURUP_API_BASE}auth/customer/login-or-register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'insurup-mcp/1.0',
          },
          body: JSON.stringify(payload),
        },
      );

      console.log(payload);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Login failed: ${response.status} ${response.statusText} ${errorText}`);
        throw new Error(
          `Login failed: ${response.status} ${response.statusText}\n\nDetails:\n${errorText}`,
        );
      }

      const data = (await response.json()) as any;

      return {
        success: true,
        message: data.message || 'MFA kodu telefon numaranıza gönderildi.',
        loginToken: data.token,
        mfaRequired: true,
      };
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error instanceof Error ? error.message : CHAT_ERRORS.LOGIN_FAILED);
    }
  }

  /**
   * MFA kodunu doğrular
   */
  static async verifyMfa(request: MfaRequest, sessionId: string): Promise<MfaResponse> {
    try {
      const response = await fetch(`${CHAT_CONSTANTS.INSURUP_API_BASE}auth/customer/verify-mfa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'insurup-mcp/1.0',
        },
        body: JSON.stringify({
          Token: request.loginToken,
          Code: request.mfaCode,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `MFA verification failed: ${response.status} ${response.statusText} ${errorText}`,
        );
        throw new Error(`MFA verification failed: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as any;
      console.log(`🔐 MFA verification API response:`, JSON.stringify(data, null, 2));

      // MFA başarılıysa session'ı güncelle ve conversation'ları migrate et
      if (data.accessToken && data.refreshToken) {
        // Token expiry tarihlerini hesapla
        const now = Date.now();
        const accessTokenExpiresAt = new Date(now + (data.expiresIn || 3600) * 1000);
        const refreshTokenExpiresAt = new Date(
          now + (data.refreshExpiresIn || 3600 * 24 * 30) * 1000,
        );

        // Önce token'ları session'a kaydet
        await AuthService.addAuthTokensToSession(
          sessionId,
          data.accessToken,
          data.refreshToken,
          accessTokenExpiresAt,
          refreshTokenExpiresAt,
        );

        // Şimdi user profile'ı al ve session'ı user session'a upgrade et
        try {
          console.log(`🔍 Getting user profile after MFA success`);
          const userProfile = await AuthService.getUserProfile(sessionId);
          if (userProfile) {
            const fullName = `${userProfile.firstName} ${userProfile.lastName}`.trim();
            console.log(`👤 User profile found: ${fullName} (ID: ${userProfile.id})`);

            // Session'ı user session'a upgrade et
            await AuthService.upgradeSessionToUser(sessionId, userProfile.id);
            console.log(`✅ Session upgraded to user session: ${userProfile.id}`);

            const { ChatRepository } = await import('../conversation/repository');
            const currentSession = await AuthService.getSession(sessionId);
            if (!currentSession) {
              throw new Error('Session not found during participant creation');
            }
            const participantId = await ChatRepository.findOrCreateParticipant(
              userProfile.id,
              fullName,
              currentSession.agentId,
              currentSession.agentUuid,
            );
            console.log(`🆔 Participant ID: ${participantId}`);

            // Mevcut session conversation'larını participant'a migrate et
            console.log(`🔄 Starting conversation migration for session: ${sessionId}`);
            await ChatRepository.migrateSessionConversations(sessionId, participantId);
            console.log(`✅ Conversation migration completed`);
          } else {
            console.log(`❌ User profile not found after MFA success`);
          }
        } catch (migrationError) {
          console.error('Conversation migration error:', migrationError);
          // Migration hatası authentication'ı engellememeli
        }
      }

      return {
        success: true,
        message: data.message || 'MFA doğrulandı',
        authenticated: !!(data.accessToken && data.refreshToken),
      };
    } catch (error) {
      console.error('MFA verification error:', error);
      throw new Error(error instanceof Error ? error.message : CHAT_ERRORS.INVALID_MFA_CODE);
    }
  }

  /**
   * Auth durumunu kontrol eder - otomatik token refresh ile
   */
  static async getAuthStatus(sessionId: string): Promise<AuthStatus> {
    const session = await AuthService.getSession(sessionId);

    if (!session?.userId || !session?.accessToken) {
      return { isAuthenticated: false };
    }

    // Access token refresh gerekip gerekmediğini kontrol et
    if (AuthService.shouldRefreshToken(session)) {
      console.log(`🔄 Access token expiring soon, attempting refresh for session: ${sessionId}`);

      const refreshSuccess = await AuthService.refreshAccessToken(sessionId);

      if (refreshSuccess) {
        // Refresh başarılıysa güncel session'ı al
        const refreshedSession = await AuthService.getSession(sessionId);
        if (refreshedSession) {
          const accessTokenExpiry =
            refreshedSession.accessTokenExpiresAt || refreshedSession.expiresAt;
          const expiryMinutes = Math.floor(
            (accessTokenExpiry.getTime() - Date.now()) / (1000 * 60),
          );

          return {
            isAuthenticated: true,
            userId: refreshedSession.userId!,
            expiryMinutes,
          };
        }
      } else {
        console.log(`❌ Token refresh failed for session: ${sessionId}`);
        return { isAuthenticated: false };
      }
    }

    // Access token süresi kontrolü
    const accessTokenExpiry = session.accessTokenExpiresAt || session.expiresAt;
    const expiryMinutes = Math.floor((accessTokenExpiry.getTime() - Date.now()) / (1000 * 60));

    if (expiryMinutes <= 0) {
      // Access token expired ve refresh de başarısız olmuş
      console.log(`❌ Access token expired and no refresh available for session: ${sessionId}`);
      return { isAuthenticated: false };
    }

    return {
      isAuthenticated: true,
      userId: session.userId,
      expiryMinutes,
    };
  }

  /**
   * Kullanıcı profilini getirir - otomatik token refresh ile
   */
  static async getUserProfile(sessionId: string): Promise<UserProfile | null> {
    const session = await AuthService.getSession(sessionId);

    if (!session?.accessToken) {
      return null;
    }

    // Access token refresh gerekip gerekmediğini kontrol et
    let currentSession = session;
    if (AuthService.shouldRefreshToken(session)) {
      console.log(
        `🔄 Access token expiring soon, refreshing before profile request for session: ${sessionId}`,
      );

      const refreshSuccess = await AuthService.refreshAccessToken(sessionId);

      if (refreshSuccess) {
        // Refresh başarılıysa güncel session'ı al
        const refreshedSession = await AuthService.getSession(sessionId);
        if (refreshedSession?.accessToken) {
          currentSession = refreshedSession;
          console.log(`✅ Using refreshed token for profile request`);
        }
      } else {
        console.log(`❌ Token refresh failed, using existing token for profile request`);
      }
    }

    try {
      const response = await fetch(`${CHAT_CONSTANTS.INSURUP_API_BASE}customers/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentSession.accessToken}`,
          'User-Agent': 'insurup-mcp/1.0',
        },
      });

      if (!response.ok) {
        console.error(`Get user profile failed: ${response.status} ${response.statusText}`);

        // 401 ise token geçersiz, refresh dene
        if (response.status === 401 && currentSession === session) {
          console.log(`🔄 401 error, attempting token refresh for session: ${sessionId}`);

          const refreshSuccess = await AuthService.refreshAccessToken(sessionId);
          if (refreshSuccess) {
            // Refresh başarılıysa recursive call yap
            console.log(`✅ Token refreshed, retrying profile request`);
            return await AuthService.getUserProfile(sessionId);
          }
        }

        return null;
      }

      const data = (await response.json()) as any;

      // API response'tan user profile bilgilerini parse et
      const fullName = data.fullName || '';
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const userProfile = {
        id: data.id || data.userId || String(data.customerId),
        firstName: firstName,
        lastName: lastName,
        email: data.primaryEmail || data.email || '',
        phoneNumber: data.primaryPhoneNumber?.number || data.phoneNumber || data.phone_number || '',
      };

      return userProfile;
    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  }

  /**
   * Logout yapar - iki farklı mod destekler
   */
  static async logout(sessionId: string, createNewSession: boolean = true): Promise<string | void> {
    console.log(
      `🔓 Logout işlemi başlıyor (session: ${sessionId}, createNewSession: ${createNewSession})`,
    );

    try {
      return await prisma.$transaction(async (tx) => {
        // Auth bilgilerini temizle
        await tx.conversationParticipantSession.update({
          where: {
            token: sessionId,
            deletedAt: null, // Soft delete'leri hariç tut
          },
          data: {
            userId: null,
            accessToken: null,
            refreshToken: null,
            accessTokenExpiresAt: null,
            refreshTokenExpiresAt: null,
            userFullName: null,
          },
        });

        console.log(`✅ Auth bilgileri temizlendi (session: ${sessionId})`);

        if (createNewSession) {
          const session = await tx.conversationParticipantSession.findUnique({
            where: {
              token: sessionId,
            },
            select: {
              agentId: true,
              agentUuid: true,
            },
          });

          if (!session) {
            throw new NotFoundException('Session not found');
          }

          // Yeni session oluştur (controller logout için)
          const newSessionId = await AuthService.createSession({
            id: session.agentId,
            uuid: session.agentUuid,
          });
          console.log(`✅ Yeni session oluşturuldu: ${newSessionId}`);
          return newSessionId;
        } else {
          // Sadece auth bilgilerini temizle (MCP tool logout için)
          console.log(`📝 Session korundu, sadece auth bilgileri temizlendi: ${sessionId}`);
          return;
        }
      });
    } catch (error) {
      console.error(`❌ Logout hatası (session: ${sessionId}):`, error);
      throw error;
    }
  }

  /**
   * Temizlik işlemi - soft delete'leri ve çok eski session'ları temizler
   * 1. Expire olan session'ları soft delete yapar
   * 2. 90 gün önce soft delete olan session'ları hard delete yapar
   * 3. Hard delete yaparken conversation'ları korur
   */
  static async cleanupExpiredSessions(): Promise<void> {
    console.log(`🧹 Starting session cleanup process`);

    try {
      await prisma.$transaction(async (tx) => {
        // 1. Expire olan ancak henüz soft delete olmayan session'ları soft delete yap
        const expiredSessions = await tx.conversationParticipantSession.findMany({
          where: {
            expiresAt: {
              lt: new Date(),
            },
            deletedAt: null,
          },
        });

        console.log(`📋 Found ${expiredSessions.length} expired sessions to soft delete`);

        if (expiredSessions.length > 0) {
          await tx.conversationParticipantSession.updateMany({
            where: {
              expiresAt: {
                lt: new Date(),
              },
              deletedAt: null,
            },
            data: {
              deletedAt: new Date(),
            },
          });

          console.log(`✅ Soft deleted ${expiredSessions.length} expired sessions`);
        }

        // 2. 90 gün önce soft delete olan session'ları hard delete yap
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

        const oldSoftDeletedSessions = await tx.conversationParticipantSession.findMany({
          where: {
            deletedAt: {
              lt: ninetyDaysAgo,
            },
          },
          include: {
            conversations: {
              where: {
                deletedAt: null,
              },
            },
          },
        });

        console.log(
          `📋 Found ${oldSoftDeletedSessions.length} old soft deleted sessions to hard delete`,
        );

        for (const session of oldSoftDeletedSessions) {
          // Conversation'ları olan session'lar için session referanslarını null'a çek
          if (session.conversations.length > 0) {
            await tx.conversation.updateMany({
              where: {
                participantSessionId: session.id,
                deletedAt: null,
              },
              data: {
                participantSessionId: null,
              },
            });

            console.log(
              `✅ Nullified session references for ${session.conversations.length} conversations (session: ${session.token})`,
            );
          }

          // Session'ı hard delete yap
          await tx.conversationParticipantSession.delete({
            where: { id: session.id },
          });

          console.log(
            `🗑️  Hard deleted session: ${session.token} (had ${session.conversations.length} conversations)`,
          );
        }

        console.log(`✅ Session cleanup completed successfully`);
      });
    } catch (error) {
      console.error(`❌ Session cleanup error:`, error);
      throw error;
    }
  }

  /**
   * Access token'ı refresh eder
   */
  static async refreshAccessToken(sessionId: string): Promise<boolean> {
    console.log(`🔄 Starting token refresh for session: ${sessionId}`);

    try {
      const session = await AuthService.getSession(sessionId);

      if (!session?.refreshToken) {
        console.log(`❌ No refresh token available for session: ${sessionId}`);
        return false;
      }

      // Refresh token'ın süresi kontrol et
      if (session.refreshTokenExpiresAt && session.refreshTokenExpiresAt < new Date()) {
        console.log(`❌ Refresh token expired for session: ${sessionId}`);
        return false;
      }

      console.log(`🔄 Refreshing access token using refresh token`);

      const response = await fetch(`${CHAT_CONSTANTS.INSURUP_API_BASE}auth/customer/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'insurup-mcp/1.0',
        },
        body: JSON.stringify({
          RefreshToken: session.refreshToken,
        }),
      });

      if (!response.ok) {
        console.error(`Token refresh failed: ${response.status} ${response.statusText}`);
        return false;
      }

      const data = (await response.json()) as any;
      console.log(`✅ Token refresh successful`);

      // Yeni token'ları session'a kaydet
      const now = Date.now();
      const accessTokenExpiresAt = new Date(now + (data.expiresIn || 3600) * 1000);
      const refreshTokenExpiresAt = new Date(
        now + (data.refreshExpiresIn || 3600 * 24 * 30) * 1000,
      );

      await AuthService.updateSession(sessionId, {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || session.refreshToken, // Yeni refresh token yoksa eskiyi koru
        accessTokenExpiresAt: accessTokenExpiresAt,
        refreshTokenExpiresAt: data.refreshToken
          ? refreshTokenExpiresAt
          : session.refreshTokenExpiresAt,
      });

      console.log(`✅ Updated session with new tokens: ${sessionId}`);
      return true;
    } catch (error) {
      console.error(`❌ Token refresh error for session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Access token'ın refresh edilmesi gerekip gerekmediğini kontrol eder
   */
  static shouldRefreshToken(session: SessionData): boolean {
    if (!session.accessToken || !session.refreshToken) {
      return false;
    }

    const accessTokenExpiry = session.accessTokenExpiresAt || session.expiresAt;
    const expiryMinutes = Math.floor((accessTokenExpiry.getTime() - Date.now()) / (1000 * 60));

    // Access token 2 dakikadan az kaldıysa refresh et
    return expiryMinutes < 2;
  }
}
