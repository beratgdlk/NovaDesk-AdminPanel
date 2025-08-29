import prisma from '@onlyjs/db';
import type { ConversationUncheckedUpdateManyInput } from '@onlyjs/db/client/models';
import { NotFoundException } from '#utils/http-errors.ts';
import type { ConversationListItem } from './types';

export abstract class ChatRepository {
  /**
   * Yeni konuşma oluşturur
   */
  static async createConversation(
    conversationId: string,
    sessionToken: string,
    participantId: string | null,
    title: string,
    lastMessage: string,
  ): Promise<void> {
    // Session token'dan gerçek session record'ını bul (agent bilgileri ile birlikte)
    const session = await prisma.conversationParticipantSession.findUnique({
      where: {
        token: sessionToken,
        deletedAt: null, // Soft delete'leri hariç tut
      },
      select: {
        id: true,
        agentId: true,
        agentUuid: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await prisma.conversation.create({
      data: {
        conversationId,
        participantSessionId: session.id, // token yerine id kullan
        conversationParticipantId: participantId,
        title,
        lastMessage,
        agentId: session.agentId,
        agentUuid: session.agentUuid,
      },
    });
  }

  /**
   * Konuşmayı günceller
   */
  static async updateConversation(
    conversationId: string,
    sessionToken: string,
    lastMessage: string,
    participantId?: string | null,
  ): Promise<void> {
    // Session token'dan gerçek session record'ını bul
    const session = await prisma.conversationParticipantSession.findUnique({
      where: {
        token: sessionToken,
        deletedAt: null, // Soft delete'leri hariç tut
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Önce mevcut conversation'ı kontrol et
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        conversationId,
        participantSessionId: session.id,
        deletedAt: null,
      },
    });

    const updateData: ConversationUncheckedUpdateManyInput = {
      lastMessage,
      updatedAt: new Date(),
    };

    // Eğer participant ID verilmişse ve mevcut conversation'da participant ID yoksa güncelle
    // Ama mevcut participant ID'yi null ile override etme
    if (participantId !== undefined && participantId !== null) {
      updateData.conversationParticipantId = participantId;
    } else if (participantId === null && existingConversation?.conversationParticipantId) {
      // Participant ID null geçilmiş ama conversation'da zaten participant ID var
      // Bu durumda participant ID'yi değiştirme (mevcut değeri koru)
      console.log(
        `🔒 Mevcut conversation participant ID korunuyor: ${existingConversation.conversationParticipantId}`,
      );
    }

    await prisma.conversation.updateMany({
      where: {
        conversationId,
        participantSessionId: session.id, // token yerine id kullan
        deletedAt: null,
      },
      data: updateData,
    });
  }

  /**
   * Konuşmaya erişim kontrolü
   */
  static async hasConversationAccess(
    conversationId: string,
    sessionToken: string,
    userId?: string,
  ): Promise<boolean> {
    console.log(
      `🔍 Checking conversation access for: ${conversationId}, sessionToken: ${sessionToken}, userId: ${userId}`,
    );

    // Session token'dan gerçek session record'ını bul
    const session = await prisma.conversationParticipantSession.findUnique({
      where: {
        token: sessionToken,
        deletedAt: null, // Soft delete'leri hariç tut
      },
    });

    if (!session) {
      console.log(`❌ Session not found for token: ${sessionToken}`);
      return false;
    }

    console.log(`✅ Session found: ${session.id}`);

    // Önce session'a göre kontrol et
    const sessionConversation = await prisma.conversation.findFirst({
      where: {
        conversationId,
        participantSessionId: session.id, // token yerine id kullan
        deletedAt: null,
      },
    });

    console.log(`🔍 Session conversation found:`, !!sessionConversation);

    if (sessionConversation) {
      return true;
    }

    // Kullanıcı giriş yapmışsa participant'a göre kontrol et
    if (userId) {
      const participant = await prisma.conversationParticipant.findFirst({
        where: { userId },
      });

      console.log(`🔍 Participant found:`, !!participant);

      if (participant) {
        const participantConversation = await prisma.conversation.findFirst({
          where: {
            conversationId,
            conversationParticipantId: participant.id,
            deletedAt: null,
          },
        });

        console.log(`🔍 Participant conversation found:`, !!participantConversation);

        return !!participantConversation;
      }
    }

    console.log(`❌ No access found for conversation: ${conversationId}`);
    return false;
  }

  /**
   * Konuşma listesini getirir
   */
  static async getConversationList(
    sessionToken: string,
    userId?: string,
  ): Promise<ConversationListItem[]> {
    // Session token'dan gerçek session record'ını bul
    const session = await prisma.conversationParticipantSession.findUnique({
      where: {
        token: sessionToken,
        deletedAt: null, // Soft delete'leri hariç tut
      },
    });

    if (!session) {
      return [];
    }

    // Kullanıcı giriş yapmışsa participant ID'sini bul
    let participantId: string | undefined;
    if (userId) {
      const participant = await prisma.conversationParticipant.findFirst({
        where: { userId },
      });
      participantId = participant?.id;
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participantSessionId: session.id }, // token yerine id kullan
          ...(participantId ? [{ conversationParticipantId: participantId }] : []),
        ],
        deletedAt: null,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return conversations.map((conv) => ({
      conversationId: conv.conversationId,
      title: conv.title || 'Yeni Konuşma',
      lastMessage: conv.lastMessage || '',
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
    }));
  }

  /**
   * Conversation participant oluşturur veya bulur
   */
  static async findOrCreateParticipant(
    userId: string, 
    fullName: string,
    agentId: number,
    agentUuid: string
  ): Promise<string> {
    console.log(`🔍 Looking for participant with userId: ${userId} for agent: ${agentUuid}`);

    let participant = await prisma.conversationParticipant.findFirst({
      where: { 
        userId,
        agentId
      },
    });

    if (!participant) {
      console.log(`➕ Creating new participant: ${fullName} (userId: ${userId}, agentId: ${agentId})`);
      participant = await prisma.conversationParticipant.create({
        data: {
          userId,
          fullName,
          agentId,
          agentUuid,
        },
      });
      console.log(`✅ Created participant with ID: ${participant.id}`);
    } else {
      console.log(`✅ Found existing participant with ID: ${participant.id}`);
    }

    return participant.id;
  }

  /**
   * Session'daki konuşmaları participant'a migrate eder
   */
  static async migrateSessionConversations(
    sessionToken: string,
    participantId: string,
  ): Promise<void> {
    console.log(
      `🔄 Starting migration for session: ${sessionToken}, participant: ${participantId}`,
    );

    // Session token'dan gerçek session record'ını bul
    const session = await prisma.conversationParticipantSession.findUnique({
      where: {
        token: sessionToken,
        deletedAt: null, // Soft delete'leri hariç tut
      },
    });

    if (!session) {
      console.log(`❌ Session not found for token: ${sessionToken}, skipping migration`);
      // Session bulunamadığında hata atmak yerine graceful handling yap
      // Session expire olmuş olabilir ama conversation'lar hala mevcut olabilir
      return;
    }

    console.log(`✅ Session found: ${session.id}`);

    // Önce migrate edilecek conversation'ları bul
    const conversationsToMigrate = await prisma.conversation.findMany({
      where: {
        participantSessionId: session.id,
        conversationParticipantId: null,
        deletedAt: null,
      },
    });

    console.log(
      `📋 Found ${conversationsToMigrate.length} conversations to migrate:`,
      conversationsToMigrate.map((c) => c.conversationId),
    );

    if (conversationsToMigrate.length === 0) {
      console.log(`ℹ️ No conversations to migrate for session: ${sessionToken}`);
      return;
    }

    // Migration işlemini gerçekleştir
    const result = await prisma.conversation.updateMany({
      where: {
        participantSessionId: session.id,
        conversationParticipantId: null,
        deletedAt: null,
      },
      data: {
        conversationParticipantId: participantId,
      },
    });

    console.log(`✅ Migration completed. Updated ${result.count} conversations.`);
  }

  /**
   * Konuşma metadata'sını database'den direkt çeker
   */
  static async getConversationMetadata(
    conversationId: string,
  ): Promise<{
    conversationId: string;
    title: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null> {
    const conversation = await prisma.conversation.findFirst({
      where: {
        conversationId,
        deletedAt: null,
      },
      select: {
        conversationId: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return conversation;
  }
}
