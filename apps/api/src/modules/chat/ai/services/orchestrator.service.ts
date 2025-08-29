import { type BaseMessage, HumanMessage, type HumanMessageFields } from '@langchain/core/messages';
import { InternalServerErrorException } from '#utils/http-errors.ts';
import type { ConversationHistory } from '../../conversation';
import { AgentManager } from './agent-manager.service';
import { ConversationService } from './ai-conversation.service';
import { CheckpointerService } from './checkpointer.service';
import { MCPClientManager } from './mcp-client-manager.service';
import { ToolManager } from './tool-manager.service';

/**
 * AI Service - Orchestrates all AI-related services
 * Sadece coordination logic'i içerir, business logic'ler ayrı service'lerde
 */
export abstract class AIService {
  private static initialized = false;

  /**
   * Tüm AI service'lerini initialize eder
   */
  static async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      console.log('🚀 Initializing AI Service...');

      // Checkpointer'ı initialize et
      await CheckpointerService.initialize();

      // Middleware'leri initialize et
      await this.initializeMiddlewares();

      this.initialized = true;
      console.log('✅ AI Service initialized successfully');
    } catch (error) {
      console.error('❌ AI Service initialization failed:', error);
      throw error;
    }
  }

  /**
   * Middleware'leri initialize eder
   */
  private static async initializeMiddlewares(): Promise<void> {
    const { ProposalService } = await import('../../proposals/service');

    // CreateKaskoProposal tool'u için middleware - proposal tracking oluşturur
    ToolManager.registerToolMiddleware('mcp__insurup__CreateKaskoProposal', {
      after: async (context, result) => {
        console.log('🔧 CreateKaskoProposal middleware after hook triggered');

        try {
          // Result'ı parse et
          let parsedResult;
          if (typeof result === 'string') {
            parsedResult = JSON.parse(result);
          } else if (result && typeof result === 'object' && (result as any).content) {
            // ToolMessage object'i ise content'i parse et
            parsedResult = JSON.parse((result as any).content);
          } else {
            console.log('🔧 Unknown result format:', typeof result);
            return;
          }

          // Başarılı response'da proposalId varsa tracking kaydı oluştur
          if (parsedResult.proposalId && context.conversationId) {
            console.log('🔧 ProposalId found, creating tracking:', parsedResult.proposalId);

            // Conversation bilgilerini al
            const db = (await import('@onlyjs/db')).default;
            const conversation = await db.conversation.findFirst({
              where: {
                conversationId: context.conversationId,
              },
              select: {
                id: true,
                conversationId: true,
                participantSessionId: true,
                conversationParticipantId: true,
              },
            });

            if (conversation) {
              console.log('🔧 Conversation found:', conversation);
              // Foreign key constraint nedeniyle conversation.id kullanmalıyız
              await ProposalService.createProposalTracking(
                parsedResult.proposalId,
                conversation.id,
                conversation.participantSessionId || undefined,
                conversation.conversationParticipantId || undefined,
              );
              console.log('🔧 ProposalTracking successfully created');
            } else {
              console.log('🔧 Conversation not found for conversationId:', context.conversationId);
            }
          }
        } catch (error) {
          console.error('❌ CreateKaskoProposal middleware error:', error);
          // Middleware hataları ana flow'u etkilemez
        }
      },
    });

    // GetProposalDetail tool'u için middleware - products'ları formatlar
    ToolManager.registerToolMiddleware('mcp__insurup__GetProposalDetail', {
      formatResponse: async (context, result) => {
        try {
          // Result'ı parse et
          let proposalDetail;
          if (typeof result === 'string') {
            proposalDetail = JSON.parse(result);
          } else if (result && typeof result === 'object' && (result as any).content) {
            // ToolMessage object'i ise content'i parse et
            proposalDetail = JSON.parse((result as any).content);
          } else {
            return result;
          }

          // Products array yoksa, original result'ı döndür
          if (!proposalDetail.products || !Array.isArray(proposalDetail.products)) {
            return result;
          }

          // Products'ları formatla - sadece ACTIVE olanları ve companies bilgisi ile
          const { ProposalFormatter } = await import('../../proposals/formatter');
          const formattedResult = ProposalFormatter.formatProposalProducts(proposalDetail.products);

          // InitialCoverage'ı da formatla
          const formattedInitialCoverage = proposalDetail.initialCoverage
            ? ProposalFormatter.formatCoverage(proposalDetail.initialCoverage)
            : null;

          // Orijinal response'ı kopyala ve sadece formatlanmış kısımları değiştir
          const cleanProposalDetail = {
            ...proposalDetail, // Tüm orijinal field'ları koru

            // Sadece formatlanmış hallerini değiştir - aynı key ismiyle
            products: formattedResult, // Raw products yerine formatlanmış products
            initialCoverage: formattedInitialCoverage, // Raw initialCoverage yerine formatlanmış coverage

            // Ek metadata ekle
            activeProductsCount: formattedResult.length,
          };

          // Clean result'ı JSON string olarak döndür
          return JSON.stringify(cleanProposalDetail);
        } catch (error) {
          console.error('❌ GetProposalDetail middleware error:', error);
          // Hata durumunda original result'ı döndür
          return result;
        }
      },
    });

    console.log('🔧 Tool middlewares initialized successfully');
  }

  /**
   * Streaming message processing
   */
  static async sendMessage({
    message,
    conversationId,
    sessionId,
    selectedModel,
  }: {
    message: string | HumanMessageFields;
    conversationId: string;
    sessionId: string;
    selectedModel?: string;
  }) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Session client'ı al ve agent'ı oluştur
      // Chat mesajları için auth gerekmez (anonymous kullanıcı da chat yapabilir)
      const sessionClient = await MCPClientManager.getClientForSession(
        sessionId,
        selectedModel,
        conversationId,
        async (mcpClient, selectedModel, conversationId) => {
          const mcpTools = await mcpClient.getTools();
          return await AgentManager.setupAgent(mcpTools, sessionId, selectedModel, conversationId);
        },
        false, // Auth gerekmez
      );

      // Agent'a mesaj gönder ve stream'i al
      if (!sessionClient.agent) {
        throw new Error('Agent not initialized');
      }

      const stream = sessionClient.agent.streamEvents(
        {
          messages: [new HumanMessage(message)],
        },
        {
          streamMode: 'messages',
          configurable: {
            thread_id: conversationId,
          },
          version: 'v2',
        },
      );

      return stream;
    } catch (error) {
      console.error('AI streaming error:', error);
      throw error;
    }
  }

  /**
   * Non-streaming message processing (backward compatibility)
   */
  static async sendMessageSync(
    message: string | HumanMessageFields,
    conversationId: string,
    sessionId: string,
    selectedModel?: string,
  ): Promise<{
    messages?: BaseMessage[];
    conversationId: string;
  }> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Session client'ı al ve agent'ı oluştur
      // Chat mesajları için auth gerekmez (anonymous kullanıcı da chat yapabilir)
      const sessionClient = await MCPClientManager.getClientForSession(
        sessionId,
        selectedModel,
        conversationId,
        async (mcpClient, selectedModel, conversationId) => {
          const mcpTools = await mcpClient.getTools();
          return await AgentManager.setupAgent(mcpTools, sessionId, selectedModel, conversationId);
        },
        false, // Auth gerekmez
      );

      if (!sessionClient.agent) {
        throw new InternalServerErrorException('Agent not initialized');
      }

      // Agent'a mesaj gönder ve direkt sonucu al (sync olarak)
      const result = await sessionClient.agent.invoke(
        {
          messages: [new HumanMessage(message)],
        },
        {
          configurable: {
            thread_id: conversationId,
          },
        },
      );

      return {
        ...result,
        conversationId,
      };
    } catch (error) {
      console.error('AI Service sendMessageSync error:', error);
      throw error;
    }
  }

  /**
   * AI conversation history'sini getirir
   */
  static async getConversationHistory(
    conversationId: string,
    sessionId: string,
    limit: number = 20,
  ): Promise<ConversationHistory> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Session client'ı al
      const sessionClient = await MCPClientManager.getClientForSession(
        sessionId,
        undefined,
        conversationId,
        async (mcpClient, selectedModel, conversationId) => {
          const mcpTools = await mcpClient.getTools();
          return await AgentManager.setupAgent(mcpTools, sessionId, selectedModel, conversationId);
        },
        false, // Auth gerekmez
      );

      // AI ConversationService ile history al
      if (!sessionClient.agent) {
        throw new Error('Agent not initialized');
      }

      return await ConversationService.getConversationHistory(
        sessionClient.agent,
        conversationId,
        limit,
      );
    } catch (error) {
      console.error('AI conversation history error:', error);

      return {
        conversationId,
        messages: [],
        totalMessages: 0,
        hasMore: false,
      };
    }
  }

  /**
   * Tüm client'ları kapatır (graceful shutdown için)
   */
  static async closeAllClients(): Promise<void> {
    try {
      await MCPClientManager.closeAllClients();
      await CheckpointerService.cleanup();
      this.initialized = false;
      console.log('✅ All clients closed and AI Service shut down');
    } catch (error) {
      console.error('❌ Error closing clients:', error);
    }
  }
}
