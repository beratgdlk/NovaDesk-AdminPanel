import { createUIMessageStream, type UIMessage } from 'ai';
import { AgentsService } from '#modules/agents/service.ts';
import { NotFoundException } from '#utils/http-errors.ts';
import { AIService } from '../ai';
import { toUIMessageStream } from '../ai/transformer';
import { AuthService } from '../auth/service';
import { MessageFormatter } from '../shared/formatters';
import { ChatRepository } from './repository';
import type {
  ChatError,
  ChatMessage,
  ChatResponse,
  ConversationHistory,
  ConversationHistoryRequest,
  ConversationList,
} from './types';

export abstract class ChatService {
  /**
   * Chat hatası oluşturur
   */
  private static createChatError(error: string, code: string, message: string): ChatError {
    return {
      error,
      code,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Chat mesajı gönderir - Streaming
   */
  static async sendMessage(data: ChatMessage, sessionId: string, domain: string) {
    try {
      let conversationId = data.conversationId;
      const isNewConversation = !conversationId;

      // Mevcut konuşma ise erişim kontrolü (session recovery YOK - sadece erişim kontrol et)
      if (conversationId) {
        if (!sessionId) {
          throw new Error('Bu konuşmaya erişiminiz yok - session bulunamadı');
        }

        // Session'ın veritabanında olup olmadığını kontrol et (recovery yapmadan)
        const session = await AuthService.getSession(sessionId);
        if (!session) {
          // Session veritabanında yok - mevcut conversation için yeni session oluşturma
          throw new Error('Bu konuşmaya erişiminiz yok - session geçersiz');
        }

        // Session geçerli, şimdi conversation access kontrol et
        try {
          const authStatus = await AuthService.getAuthStatus(sessionId);
          const hasAccess = await ChatRepository.hasConversationAccess(
            conversationId,
            sessionId,
            authStatus.userId,
          );

          if (!hasAccess) {
            // Mevcut conversation'a erişim yok - session recovery yapma
            throw new Error('Bu konuşmaya erişiminiz yok - yetkisiz erişim');
          }
        } catch (authError) {
          console.error('Authorization check failed:', authError);
          // Auth hatası - mevcut conversation için session recovery yapma
          throw new Error('Bu konuşmaya erişiminiz yok - yetki kontrolü başarısız');
        }
      } else {
        // Yeni conversation - session recovery controller'da yapıldı
        // Session ID zaten geçerli olmalı, ama yine de kontrol edelim
        if (!sessionId) {
          // Controller'da session recovery yapılmamışsa yeni session oluştur
          console.log('🆕 No session found for new conversation, creating new session');
          const agent = await AgentsService.showByDomain(domain);
          sessionId = await AuthService.createSession(agent);
        }
      }

      // Yeni konuşma ise ID oluştur
      if (isNewConversation) {
        conversationId = crypto.randomUUID();
      }

      const messageId = crypto.randomUUID();
      const createdAt = new Date().toISOString();

      const uiMessageStream = createUIMessageStream({
        execute: async ({ writer }) => {
          if (isNewConversation) {
            writer.write({
              type: 'data-new_conversation',
              data: {
                conversationId: conversationId!,
                isNewConversation: true,
              },
            });
          }

          writer.write({
            type: 'data-user_message',
            data: {
              messageId: messageId,
              timestamp: createdAt,
            },
          });

          const langGraphStream = await AIService.sendMessage({
            conversationId: conversationId!,
            sessionId,
            selectedModel: data.selectedModel || undefined,
            message: {
              id: messageId,
              content: data.message,
            },
          });

          const transformedLangGraphStream = new ReadableStream({
            async start(controller) {
              try {
                for await (const chunk of langGraphStream) {
                  controller.enqueue(chunk);
                  /* if (Array.isArray(chunk) && chunk.length > 0) {
                    controller.enqueue(chunk[0]);
                  } */
                }
                controller.close();
              } catch (error) {
                controller.error(error);
              }
            },
          });

          // Transform stream to only yield first item of each array
          const uiMessageStream = toUIMessageStream(transformedLangGraphStream, {
            onFinal: async (completion) => {
              // Database'e kaydet
              try {
                console.log(
                  `💾 Starting database save for conversationId: ${conversationId}, sessionId: ${sessionId}`,
                );

                let authStatus;
                let participantId: string | null = null;

                try {
                  authStatus = await AuthService.getAuthStatus(sessionId);
                  console.log(
                    `📊 Session status after stream completion: sessionId=${sessionId}, isAuthenticated=${authStatus.isAuthenticated}, userId=${authStatus.userId}`,
                  );

                  if (authStatus.isAuthenticated && authStatus.userId) {
                    const userProfile = await AuthService.getUserProfile(sessionId);
                    const session = await AuthService.getSession(sessionId);
                    if (userProfile && session) {
                      const fullName = `${userProfile.firstName} ${userProfile.lastName}`.trim();
                      participantId = await ChatRepository.findOrCreateParticipant(
                        authStatus.userId,
                        fullName,
                        session.agentId,
                        session.agentUuid,
                      );
                    }
                  }
                } catch (authError) {
                  console.warn(
                    `⚠️ Auth status check failed, saving conversation without participant: ${authError}`,
                  );
                  authStatus = { isAuthenticated: false };
                }

                try {
                  if (isNewConversation) {
                    console.log(
                      `💾 Creating new conversation: ${conversationId}, sessionId=${sessionId}, participantId=${participantId}`,
                    );
                    await ChatRepository.createConversation(
                      conversationId!,
                      sessionId,
                      participantId,
                      ChatService.generateTitle(data.message),
                      ChatService.formatLastMessage(completion),
                    );
                  } else {
                    console.log(
                      `📝 Updating existing conversation: ${conversationId}, sessionId=${sessionId}, participantId=${participantId}`,
                    );
                    await ChatRepository.updateConversation(
                      conversationId!,
                      sessionId,
                      ChatService.formatLastMessage(completion),
                      participantId,
                    );
                  }
                  console.log(`✅ Database save completed successfully`);
                } catch (dbSaveError) {
                  console.error(`❌ Database save failed: ${dbSaveError}`);
                  // Database kaydetme başarısız olsa bile stream devam edebilir
                }
              } catch (dbError) {
                console.error('Database save error during streaming:', dbError);
                throw dbError;
              }
            },
          });

          const transformedUiMessageStream = new ReadableStream({
            async start(controller) {
              for await (const message of uiMessageStream) {
                const modifiedMessage = {
                  ...message,
                };
                if ('id' in modifiedMessage) {
                  (modifiedMessage as any).id = messageId;
                }

                if (modifiedMessage.type === 'text-end') {
                  modifiedMessage.providerMetadata = {
                    ...(modifiedMessage.providerMetadata || {}),
                    backend: {
                      ...(modifiedMessage.providerMetadata?.backend || {}),
                      timestamp: createdAt,
                    },
                  };
                }

                controller.enqueue(modifiedMessage);
              }

              controller.close();
            },
          });

          writer.merge(transformedUiMessageStream);
        },
        generateId: () => messageId,
      });

      /*  for await (const message of uiMessageStream) {
        console.log(message, 'message');
      } */

      return uiMessageStream;
    } catch (error) {
      console.error('🚨 Chat service streaming error:', error);
      console.error('🚨 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error(
        '🚨 Error context - conversationId:',
        data.conversationId,
        'sessionId:',
        sessionId,
      );

      throw error;
    }
  }

  /**
   * WebSocket için chat mesajı işler - WebSocket'ten gelen mesajları handle eder
   */
  static async handleWebSocketMessage(
    message: string,
    conversationId: string | undefined,
    selectedModel: string | undefined,
    sessionId: string,
    domain: string,
  ): Promise<ChatResponse> {
    try {
      const data = {
        message,
        conversationId,
        selectedModel,
      };

      // Sync version kullan - WebSocket zaten real-time
      const mcpResponse = await ChatService.sendMessageSync(data, sessionId, domain);

      let finalConversationId = conversationId;
      const isNewConversation = !conversationId;

      if (isNewConversation) {
        finalConversationId = crypto.randomUUID();
      }

      // Auth bilgilerini al
      const authStatus = await AuthService.getAuthStatus(sessionId);
      let participantId: string | null = null;

      if (authStatus.isAuthenticated && authStatus.userId) {
        const userProfile = await AuthService.getUserProfile(sessionId);
        const session = await AuthService.getSession(sessionId);
        if (userProfile && session) {
          const fullName = `${userProfile.firstName} ${userProfile.lastName}`.trim();
          participantId = await ChatRepository.findOrCreateParticipant(
            userProfile.id,
            fullName,
            session.agentId,
            session.agentUuid,
          );
        }
      }

      // Response text'ini extract et (database için)
      let responseText = '';
      if (mcpResponse.messages && mcpResponse.messages.length > 0) {
        // UIMessage formatından text content'i extract et
        const lastMessage = mcpResponse.messages[mcpResponse.messages.length - 1];
        if (lastMessage && lastMessage.parts) {
          const textPart = lastMessage.parts.find((part) => part.type === 'text');
          if (textPart && 'text' in textPart) {
            responseText = String(textPart.text);
          }
        }
      }

      // Database'e kaydet
      if (isNewConversation) {
        await ChatRepository.createConversation(
          finalConversationId!,
          sessionId,
          participantId,
          ChatService.generateTitle(message),
          ChatService.formatLastMessage(responseText),
        );
      } else {
        await ChatRepository.updateConversation(
          finalConversationId!,
          sessionId,
          ChatService.formatLastMessage(responseText),
        );
      }

      return {
        conversationId: finalConversationId!,
        messages: mcpResponse.messages,
      };
    } catch (error) {
      console.error('WebSocket message handling error:', error);
      throw error;
    }
  }

  /**
   * WebSocket için conversation history işler
   */
  static async handleWebSocketConversationHistory(
    conversationId: string,
    sessionId: string,
    limit?: number,
  ): Promise<ConversationHistory> {
    try {
      // Erişim kontrolü
      const authStatus = await AuthService.getAuthStatus(sessionId);
      const hasAccess = await ChatRepository.hasConversationAccess(
        conversationId,
        sessionId,
        authStatus.userId,
      );

      if (!hasAccess) {
        throw new Error('Bu konuşmaya erişiminiz yok');
      }

      // History al
      const history = await ChatService.getConversationHistory(
        conversationId,
        sessionId,
        limit || 20,
      );

      return history;
    } catch (error) {
      console.error('WebSocket conversation history error:', error);
      throw error;
    }
  }

  /**
   * WebSocket için conversation list işler
   */
  static async handleWebSocketConversationList(
    sessionId: string,
  ): Promise<{ conversations: any[]; total: number }> {
    try {
      const conversationList = await ChatService.getConversationList(sessionId);

      return {
        conversations: conversationList.conversations || [],
        total: conversationList.conversations?.length || 0,
      };
    } catch (error) {
      console.error('WebSocket conversation list error:', error);
      throw error;
    }
  }

  /**
   * Chat mesajı gönderir - Non-streaming (backward compatibility)
   */
  static async sendMessageSync(
    data: ChatMessage,
    sessionId: string,
    domain?: string,
  ): Promise<ChatResponse> {
    try {
      let conversationId = data.conversationId;
      const isNewConversation = !conversationId;
      let sessionRecovery = { isRecovered: false, sessionId };

      // Mevcut konuşma ise erişim kontrolü (session recovery YOK)
      if (conversationId) {
        if (!sessionId) {
          throw new Error('Bu konuşmaya erişiminiz yok - session bulunamadı');
        }

        // Session'ın veritabanında olup olmadığını kontrol et (recovery yapmadan)
        const session = await AuthService.getSession(sessionId);
        if (!session) {
          throw new Error('Bu konuşmaya erişiminiz yok - session geçersiz');
        }

        // Session geçerli, şimdi conversation access kontrol et
        try {
          const authStatus = await AuthService.getAuthStatus(sessionId);
          const hasAccess = await ChatRepository.hasConversationAccess(
            conversationId,
            sessionId,
            authStatus.userId,
          );

          if (!hasAccess) {
            throw new Error('Bu konuşmaya erişiminiz yok - yetkisiz erişim');
          }
        } catch (authError) {
          throw new Error('Bu konuşmaya erişiminiz yok - yetki kontrolü başarısız');
        }
      } else {
        // Yeni conversation - session recovery controller'da yapıldı
        // Session ID zaten geçerli olmalı, ama yine de kontrol edelim
        if (!sessionId) {
          // Controller'da session recovery yapılmamışsa yeni session oluştur
          console.log('🆕 No session found for new conversation, creating new session');
          if (!domain) {
            throw new NotFoundException('Domain not found');
          }
          const agent = await AgentsService.showByDomain(domain);
          const newSessionId = await AuthService.createSession(agent);
          sessionRecovery = { isRecovered: true, sessionId: newSessionId };
          sessionId = newSessionId;
        }
      }

      // Yeni konuşma ise ID oluştur
      if (isNewConversation) {
        conversationId = crypto.randomUUID();
      }

      // MCP'ye mesaj gönder
      const mcpResponse = await AIService.sendMessageSync(
        data.message,
        conversationId!,
        sessionId,
        data.selectedModel || undefined,
      );

      // Response text'ini extract et (database için)
      let responseText = '';
      if (mcpResponse.messages && Array.isArray(mcpResponse.messages)) {
        const lastMessage = mcpResponse.messages[mcpResponse.messages.length - 1];
        if (lastMessage && lastMessage.content) {
          responseText = String(lastMessage.content);
        }
      }

      // Messages'ları UIMessage formatına çevir
      let formattedMessages: UIMessage[] = [];
      if (mcpResponse && mcpResponse.messages && Array.isArray(mcpResponse.messages)) {
        formattedMessages = MessageFormatter.formatMessages(mcpResponse.messages);
      }

      // Auth bilgilerini al
      const authStatus = await AuthService.getAuthStatus(sessionId);
      let participantId: string | null = null;

      if (authStatus.isAuthenticated && authStatus.userId) {
        const userProfile = await AuthService.getUserProfile(sessionId);
        const session = await AuthService.getSession(sessionId);
        if (userProfile && session) {
          const fullName = `${userProfile.firstName} ${userProfile.lastName}`.trim();
          participantId = await ChatRepository.findOrCreateParticipant(
            authStatus.userId,
            fullName,
            session.agentId,
            session.agentUuid,
          );
        }
      }

      // Database'e kaydet
      if (isNewConversation) {
        await ChatRepository.createConversation(
          conversationId!,
          sessionId,
          participantId,
          ChatService.generateTitle(data.message),
          ChatService.formatLastMessage(responseText),
        );
      } else {
        await ChatRepository.updateConversation(
          conversationId!,
          sessionId,
          ChatService.formatLastMessage(responseText),
          participantId,
        );
      }

      const chatResponse: ChatResponse = {
        conversationId: conversationId!,
        messages: formattedMessages,
      };

      // Session recovery yapıldıysa yeni session ID'yi ekle
      if (sessionRecovery.isRecovered) {
        chatResponse.newSessionId = sessionRecovery.sessionId;
        chatResponse.sessionUpdated = true;
      }

      return chatResponse;
    } catch (error) {
      console.error(error, 'error');
      const chatError = ChatService.createChatError(
        error instanceof Error ? error.message : 'Unknown error',
        'CHAT_ERROR',
        'Mesaj gönderilirken hata oluştu',
      );
      throw new Error(chatError.message);
    }
  }

  /**
   * Konuşma geçmişini getirir
   */
  static async getConversationHistory(
    conversationId: string,
    sessionId: string,
    limit?: number,
  ): Promise<ConversationHistory> {
    try {
      console.log(`🔍 Getting conversation history for: ${conversationId}, session: ${sessionId}`);

      // Session'ın veritabanında olup olmadığını kontrol et (recovery yapmadan)
      if (!sessionId) {
        console.log(`❌ No session ID provided for conversation: ${conversationId}`);
        return {
          conversationId,
          messages: [],
          totalMessages: 0,
          hasMore: false,
        };
      }

      const session = await AuthService.getSession(sessionId);
      if (!session) {
        console.log(
          `❌ Session not found for conversation: ${conversationId}, sessionId: ${sessionId}`,
        );
        return {
          conversationId,
          messages: [],
          totalMessages: 0,
          hasMore: false,
        };
      }

      // Session geçerli, şimdi erişim kontrolü
      const authStatus = await AuthService.getAuthStatus(sessionId);
      console.log(`🔍 Auth status:`, authStatus);

      const hasAccess = await ChatRepository.hasConversationAccess(
        conversationId,
        sessionId,
        authStatus.userId,
      );
      console.log(`🔍 Has access: ${hasAccess}`);

      // Eğer erişim yoksa, conversation hiç yoksa boş history döndür
      if (!hasAccess) {
        console.log(`⚠️ No access to conversation: ${conversationId}, returning empty history`);
        return {
          conversationId,
          messages: [],
          totalMessages: 0,
          hasMore: false,
        };
      }

      // MCP'den history al
      const history = await AIService.getConversationHistory(
        conversationId,
        sessionId,
        limit ?? 20,
      );

      return history;
    } catch (error) {
      console.error(`❌ Error getting conversation history:`, error);
      const chatError = ChatService.createChatError(
        error instanceof Error ? error.message : 'Unknown error',
        'HISTORY_ERROR',
        'Konuşma geçmişi alınırken hata oluştu',
      );
      throw new Error(chatError.message);
    }
  }

  /**
   * Konuşma listesini getirir
   */
  static async getConversationList(sessionId: string): Promise<ConversationList> {
    try {
      // Session'ın veritabanında olup olmadığını kontrol et (recovery yapmadan)
      if (!sessionId) {
        return {
          conversations: [],
          total: 0,
        };
      }

      const session = await AuthService.getSession(sessionId);
      if (!session) {
        return {
          conversations: [],
          total: 0,
        };
      }

      // Session geçerli, şimdi conversation listesini al
      const authStatus = await AuthService.getAuthStatus(sessionId);
      const conversations = await ChatRepository.getConversationList(sessionId, authStatus.userId);

      return {
        conversations,
        total: conversations.length,
      };
    } catch (error) {
      const chatError = ChatService.createChatError(
        error instanceof Error ? error.message : 'Unknown error',
        'LIST_ERROR',
        'Konuşma listesi alınırken hata oluştu',
      );
      throw new Error(chatError.message);
    }
  }

  /**
   * Konuşma başlığı oluşturur
   */
  private static generateTitle(message: string): string {
    const words = message.trim().split(' ').slice(0, 6);
    let title = words.join(' ');

    if (message.split(' ').length > 6) {
      title += '...';
    }

    return title.length > 50 ? title.substring(0, 47) + '...' : title;
  }

  /**
   * Son mesajı formatlar
   */
  private static formatLastMessage(message: string): string {
    return message.length > 500 ? message.substring(0, 500) + '...' : message;
  }

  /**
   * Konuşma geçmişi request'ini process eder
   */
  static async processConversationHistoryRequest(
    request: ConversationHistoryRequest,
    sessionId: string,
  ): Promise<ConversationHistory> {
    return await ChatService.getConversationHistory(
      request.conversationId,
      sessionId,
      request.limit,
    );
  }

  /**
   * Kullanıcı giriş yaptığında session konuşmalarını migrate eder
   */
  static async migrateSessionConversations(sessionId: string, userId: string): Promise<void> {
    const userProfile = await AuthService.getUserProfile(sessionId);
    const session = await AuthService.getSession(sessionId);
    if (!userProfile || !session) return;

    const fullName = `${userProfile.firstName} ${userProfile.lastName}`.trim();
    const participantId = await ChatRepository.findOrCreateParticipant(
      userId,
      fullName,
      session.agentId,
      session.agentUuid,
    );

    await ChatRepository.migrateSessionConversations(sessionId, participantId);
  }
}
