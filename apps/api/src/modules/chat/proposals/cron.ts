import { cron } from '@elysiajs/cron';
import { Elysia } from 'elysia';
import { ProposalService } from './service';
import prisma from '@onlyjs/db';
import { ChatService } from '../conversation';

export const proposalsCron = new Elysia().use(
  cron({
    name: 'process-proposal-trackings',
    pattern: '*/30 * * * * *', // Her 30 saniyede bir
    run: async () => {
      try {
        // İşlenmemiş ve 3 dakika geçmiş proposal tracking'leri al
        const unprocessedTrackings = await ProposalService.getUnprocessedProposalTrackings(1);

        if (unprocessedTrackings.length === 0) {
          return; // İşlenecek proposal tracking yok
        }

        console.log(`🔄 Processing ${unprocessedTrackings.length} unprocessed proposal trackings`);

        for (const tracking of unprocessedTrackings) {
          try {
            // Conversation için session bilgilerini al
            let sessionToken: string | null = null;
            let externalConversationId: string | null = null;

            if (tracking.participantSessionId) {
              // participantSessionId aslında session.id'si, biz token'a ihtiyacımız var
              const sessionRecord = await prisma.conversationParticipantSession.findUnique({
                where: {
                  id: tracking.participantSessionId,
                  deletedAt: null, // Soft delete'leri hariç tut
                },
                select: {
                  token: true,
                },
              });

              if (!sessionRecord) {
                console.warn(
                  `⚠️ Session record not found for proposal tracking: ${tracking.id}, sessionId: ${tracking.participantSessionId}`,
                );
                continue;
              }

              sessionToken = sessionRecord.token;
            }

            // Conversation'ın external ID'sini al
            const conversationRecord = await prisma.conversation.findUnique({
              where: {
                id: tracking.conversationId, // tracking.conversationId = internal ID
              },
              select: {
                conversationId: true, // external ID
              },
            });

            if (!conversationRecord) {
              console.warn(
                `⚠️ Conversation not found for proposal tracking: ${tracking.id}, conversationId: ${tracking.conversationId}`,
              );
              continue;
            }

            externalConversationId = conversationRecord.conversationId;

            if (!sessionToken) {
              console.warn(`⚠️ No valid session token for proposal tracking: ${tracking.id}`);
              continue;
            }

            if (!externalConversationId) {
              console.warn(
                `⚠️ No valid external conversation ID for proposal tracking: ${tracking.id}`,
              );
              continue;
            }

            // Chat history'ye "teklifleri göster" mesajını ekle
            await addHiddenProposalCheckMessage(externalConversationId, sessionToken);

            // Sadece başarılı olursa proposal tracking'i işlenmiş olarak işaretle
            await ProposalService.markProposalTrackingAsProcessed(tracking.id);

            console.log(`✅ Successfully processed proposal tracking: ${tracking.proposalId}`);
          } catch (error) {
            console.error(`❌ Error processing proposal tracking ${tracking.id}:`, error);

            // Hata durumunda processed olarak işaretleme - retry edilmeli
            // Sadece kritik hatalar için işaretleyebiliriz (ör. invalid data)
            if (error instanceof Error && error.message.includes('Invalid conversation')) {
              console.warn(
                `⚠️ Marking proposal tracking as processed due to invalid data: ${tracking.id}`,
              );
              await ProposalService.markProposalTrackingAsProcessed(tracking.id);
            }
            // Diğer hatalar için retry edilmeli
          }
        }
      } catch (error) {
        console.error('❌ Failed to process proposal trackings:', error);
      }
    },
  }),
);

/**
 * Chat history'ye gizli "teklifleri göster" mesajını ekler
 */
async function addHiddenProposalCheckMessage(
  externalConversationId: string,
  sessionToken: string,
): Promise<void> {
  try {
    // AI service'i kullanarak mesajı gönder
    // Bu mesaj özel marker ile işaretlenecek ve history'de isHidden: true olarak gösterilecek
    const response = await ChatService.sendMessageSync(
      {
        conversationId: externalConversationId,
        message: '[HIDDEN] teklifleri göster',
      },
      sessionToken,
    );

    console.log(
      `✅ Hidden proposal check message added to conversation: ${externalConversationId}`,
    );
  } catch (error) {
    console.error(`❌ Error adding hidden proposal check message:`, error);
    throw error;
  }
}
