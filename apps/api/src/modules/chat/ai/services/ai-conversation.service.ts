import type { mapStoredMessageToChatMessage } from '@langchain/core/messages';
import type { createReactAgent } from '@langchain/langgraph/prebuilt';
import type { ConversationHistory } from '../../conversation/types';
import { MessageFormatter } from '../../shared/formatters';

/**
 * AI Conversation history management ve message processing
 */
export class ConversationService {
  /**
   * Conversation history'sini UIMessage formatında getirir
   */
  static async getConversationHistory(
    agent: ReturnType<typeof createReactAgent>,
    conversationId: string,
    limit: number = 20,
  ): Promise<ConversationHistory> {
    try {
      // Get state history from agent
      const snapshot = await agent.getState({
        configurable: {
          thread_id: conversationId,
        },
      });

      // Get recent messages (limit * 2 for user + AI pairs)
      const recentMessages = snapshot.values?.messages.slice(-limit * 2) as ReturnType<
        typeof mapStoredMessageToChatMessage
      >[];

      if (!recentMessages || recentMessages.length === 0) {
        return {
          conversationId,
          messages: [],
          totalMessages: 0,
          hasMore: false,
        };
      }

      // Format messages using MessageFormatter
      const formattedMessages = MessageFormatter.formatMessages(recentMessages);

      return {
        conversationId,
        messages: formattedMessages,
        totalMessages: formattedMessages.length,
        hasMore: recentMessages.length >= limit * 2,
      };
    } catch (error) {
      console.error('Conversation history error:', error);

      return {
        conversationId,
        messages: [],
        totalMessages: 0,
        hasMore: false,
      };
    }
  }
}
