import db from '@onlyjs/db';
import { AuthService } from '../auth/service';
import { CHAT_CONSTANTS } from '../shared/constants';
import type { ProposalProductsResponse } from './types';

export abstract class ProposalService {
  /**
   * Proposal tracking kaydı oluşturur
   */
  static async createProposalTracking(
    proposalId: string,
    conversationId: string,
    participantSessionId?: string,
    conversationParticipantId?: string,
  ): Promise<void> {
    try {
      await db.proposalTracking.create({
        data: {
          proposalId,
          conversationId,
          participantSessionId,
          conversationParticipantId,
        },
      });

      console.log(`✅ ProposalTracking created: ${proposalId} for conversation: ${conversationId}`);
    } catch (error) {
      console.error('❌ ProposalTracking creation failed:', error);
      throw error;
    }
  }

  /**
   * İşlenmemiş proposal tracking'leri getirir (3 dakika geçmiş olanlar)
   */
  static async getUnprocessedProposalTrackings(minutesAgo: number = 3): Promise<
    Array<{
      id: number;
      proposalId: string;
      conversationId: string;
      participantSessionId: string | null;
      conversationParticipantId: string | null;
      createdAt: Date;
    }>
  > {
    try {
      const cutoffTime = new Date(Date.now() - minutesAgo * 60 * 1000);

      const unprocessedTrackings = await db.proposalTracking.findMany({
        where: {
          isProcessed: false,
          createdAt: {
            lt: cutoffTime,
          },
          deletedAt: null,
        },
        select: {
          id: true,
          proposalId: true,
          conversationId: true,
          participantSessionId: true,
          conversationParticipantId: true,
          createdAt: true,
        },
      });

      return unprocessedTrackings;
    } catch (error) {
      console.error('❌ Error getting unprocessed proposal trackings:', error);
      return [];
    }
  }

  /**
   * Proposal tracking'i işlenmiş olarak işaretler
   */
  static async markProposalTrackingAsProcessed(id: number): Promise<void> {
    try {
      await db.proposalTracking.update({
        where: { id },
        data: { isProcessed: true },
      });

      console.log(`✅ ProposalTracking marked as processed: ${id}`);
    } catch (error) {
      console.error('❌ Error marking proposal tracking as processed:', error);
      throw error;
    }
  }

  /**
   * Proposal products'ını getirir (raw data)
   */
  static async getProposalProducts(
    proposalId: string,
    sessionId: string,
  ): Promise<ProposalProductsResponse> {
    try {
      // Session bilgilerini al
      const session = await AuthService.getSession(sessionId);
      if (!session) {
        return {
          success: false,
          products: [],
          error: 'Session bulunamadı veya süresi dolmuş',
        };
      }

      // Access token kontrolü
      if (!session.accessToken) {
        return {
          success: false,
          products: [],
          error: 'Giriş yapılmamış. Lütfen önce giriş yapın.',
        };
      }

      // API isteği
      const response = await fetch(
        `${CHAT_CONSTANTS.INSURUP_API_BASE}proposals/${proposalId}/products`,
        {
          method: 'GET',
          headers: {
            'User-Agent': 'insurup-mcp/1.0',
            Authorization: `Bearer ${session.accessToken}`,
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error: ${response.status} - ${errorText}`);
        return {
          success: false,
          products: [],
          error: `API hatası: ${response.status} - ${errorText}`,
        };
      }

      const data = await response.json();

      // Veri array olmadığı durumda hata döndür
      if (!Array.isArray(data)) {
        console.error('❌ API response is not an array:', data);
        return {
          success: false,
          products: [],
          error: 'API yanıtı beklenmeyen formatta',
        };
      }

      console.log(`✅ ProposalService: ${data.length} proposal product retrieved`);

      return {
        success: true,
        products: data,
      };
    } catch (error) {
      console.error('❌ ProposalService.getProposalProducts error:', error);
      return {
        success: false,
        products: [],
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      };
    }
  }
}
