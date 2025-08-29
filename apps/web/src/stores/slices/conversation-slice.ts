import type { ThreadMessageLike } from '@assistant-ui/react';
import type { Writable } from 'type-fest';
import type { StateCreator } from 'zustand';
import { api } from '#lib/api.ts';
import type { ConversationData, ConversationListItem } from '#types/chat.types.ts';

// Simplified conversation slice state
export interface ConversationSliceState {
  // Current active conversation
  currentConversationId: string | null;

  // Unified conversation storage - messages included
  conversationList: ConversationData[];

  // Backend conversation list for sync
  backendConversationList: ConversationListItem[];

  // Refresh trigger for conversation list
  refreshTrigger: number;
}

// Simplified conversation slice actions
export interface ConversationSliceActions {
  // Current conversation management
  setCurrentConversationId: (conversationId: string | null) => void;
  createNewConversation: () => string;
  switchToConversation: (conversationId: string) => void;

  // Conversation operations
  renameConversation: (conversationId: string, newTitle: string) => void;
  archiveConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;

  // Message operations within conversations
  addMessageToConversation: (conversationId: string, message: ThreadMessageLike) => void;
  updateMessageInConversation: (
    conversationId: string,
    messageId: string,
    updater: (message: ThreadMessageLike) => ThreadMessageLike,
  ) => void;
  updateConversationMessages: (conversationId: string, messages: ThreadMessageLike[]) => void;

  // Backend integration
  refreshConversationList: () => void;
  fetchConversationList: () => Promise<void>;
  loadConversationHistory: (conversationId: string) => Promise<ThreadMessageLike[]>;
  loadConversationHistoryAndSwitch: (conversationId: string) => Promise<void>;

  // Helper methods
  getCurrentConversation: () => ConversationData | null;
  getConversationMessages: (conversationId: string) => ThreadMessageLike[];
}

// Combined conversation slice type
export type ConversationSlice = ConversationSliceState & ConversationSliceActions;

// Simplified conversation slice creator
export const createConversationSlice: StateCreator<ConversationSlice, [], [], ConversationSlice> = (
  set,
  get,
) => ({
  // Initial state
  currentConversationId: null,
  conversationList: [],
  backendConversationList: [],
  refreshTrigger: 0,

  // Current conversation management
  setCurrentConversationId: (conversationId) => {
    set({ currentConversationId: conversationId });
  },

  createNewConversation: () => {
    const { conversationList, currentConversationId } = get();

    // Check if current conversation is empty - don't create new one
    if (currentConversationId && currentConversationId.startsWith('conversation-')) {
      const currentConversation = conversationList.find(
        (c) => c.threadId === currentConversationId,
      );
      if (currentConversation && currentConversation.messages.length === 0) {
        return currentConversationId;
      }
    }

    // Create new conversation
    const conversationId = `conversation-${Date.now()}`;
    const newConversation: ConversationData = {
      threadId: conversationId,
      status: 'regular',
      title: 'Yeni Konuşma',
      lastUpdated: new Date(),
      messages: [],
    };

    set({
      conversationList: [...conversationList, newConversation],
      currentConversationId: conversationId,
    });

    return conversationId;
  },

  switchToConversation: (conversationId) => {
    set({ currentConversationId: conversationId });
  },

  renameConversation: (conversationId, newTitle) => {
    const { conversationList } = get();
    const newConversationList = conversationList.map((conv) =>
      conv.threadId === conversationId ? { ...conv, title: newTitle } : conv,
    );
    set({ conversationList: newConversationList });
  },

  archiveConversation: (conversationId) => {
    const { conversationList } = get();
    const newConversationList = conversationList.map((conv) =>
      conv.threadId === conversationId ? { ...conv, status: 'archived' as const } : conv,
    );
    set({ conversationList: newConversationList });
  },

  deleteConversation: (conversationId) => {
    const { conversationList, currentConversationId } = get();

    // Remove from conversation list
    const newConversationList = conversationList.filter((conv) => conv.threadId !== conversationId);

    // If deleted conversation was current, switch to another or create new
    let newCurrentConversationId = currentConversationId;
    if (currentConversationId === conversationId) {
      const regularConversations = newConversationList.filter((c) => c.status === 'regular');
      if (regularConversations.length > 0) {
        newCurrentConversationId = regularConversations[0].threadId;
      } else {
        // Create new conversation if no regular ones left
        const newConversationId = `conversation-${Date.now()}`;
        const newConversation: ConversationData = {
          threadId: newConversationId,
          status: 'regular',
          title: 'Yeni Konuşma',
          lastUpdated: new Date(),
          messages: [],
        };
        newConversationList.push(newConversation);
        newCurrentConversationId = newConversationId;
      }
    }

    set({
      conversationList: newConversationList,
      currentConversationId: newCurrentConversationId,
    });
  },

  // Message operations within conversations
  addMessageToConversation: (conversationId, message) => {
    const { conversationList } = get();
    const newConversationList = conversationList.map((conv) =>
      conv.threadId === conversationId
        ? { ...conv, messages: [...conv.messages, message], lastUpdated: new Date() }
        : conv,
    );
    set({ conversationList: newConversationList });
  },

  updateMessageInConversation: (conversationId, messageId, updater) => {
    const { conversationList } = get();
    const newConversationList = conversationList.map((conv) => {
      if (conv.threadId === conversationId) {
        const messageIndex = conv.messages.findIndex((msg) => msg.id === messageId);
        if (messageIndex !== -1) {
          const newMessages = [...conv.messages];
          newMessages[messageIndex] = updater(newMessages[messageIndex]);
          return { ...conv, messages: newMessages };
        }
      }
      return conv;
    });
    set({ conversationList: newConversationList });
  },

  updateConversationMessages: (conversationId, messages) => {
    const { conversationList } = get();
    const newConversationList = conversationList.map((conv) =>
      conv.threadId === conversationId ? { ...conv, messages } : conv,
    );
    set({ conversationList: newConversationList });
  },

  // Backend integration
  refreshConversationList: () => {
    set((state) => ({ refreshTrigger: state.refreshTrigger + 1 }));
  },

  fetchConversationList: async () => {
    try {
      const response = await api.chat.conversations.get({
        headers: {},
      });

      if (response.data) {
        const backendConversations = response.data.conversations || [];

        // Update backend conversation list
        set({ backendConversationList: backendConversations });

        // Sync with frontend conversation list
        const { conversationList } = get();
        const newConversationList = [...conversationList];

        backendConversations.forEach((conv) => {
          const existingIndex = newConversationList.findIndex(
            (c) => c.threadId === conv.conversationId,
          );

          if (existingIndex === -1) {
            // Add new conversation from backend (without messages - will be loaded when selected)
            newConversationList.push({
              threadId: conv.conversationId,
              title: conv.title,
              status: 'regular' as const,
              lastUpdated: new Date(conv.updatedAt),
              messages: [], // Empty initially
            });
          } else {
            // Update existing conversation metadata - preserve messages
            const existingConv = newConversationList[existingIndex];

            newConversationList[existingIndex] = {
              ...existingConv,
              title: conv.title,
              lastUpdated: new Date(conv.updatedAt),
              // Explicitly preserve messages
              messages: existingConv.messages,
            };
          }
        });

        set({ conversationList: newConversationList });
      }
    } catch (error) {
      console.error('❌ Failed to fetch conversation list:', error);
    }
  },

  loadConversationHistory: async (conversationId: string): Promise<ThreadMessageLike[]> => {
    try {
      const response = await api.chat.history.get({
        headers: {
          'x-conversation-id': conversationId,
        },
        query: {},
      });

      if (response.data) {
        const { messages: historyMessages } = response.data;

        // Convert API messages to ThreadMessageLike
        const threadMessages: ThreadMessageLike[] = historyMessages.map((msg) => {
          const contentParts: Writable<ThreadMessageLike['content']> = [];

          // Process parts array
          if (msg.parts && Array.isArray(msg.parts)) {
            // biome-ignore lint/suspicious/noExplicitAny: <Complex type>
            msg.parts.forEach((part: any) => {
              if (part.type === 'text') {
                // Text content
                contentParts.push({ type: 'text', text: part.text });
              } else if (part.type.startsWith('tool-')) {
                // Tool call content
                const hasError = part.errorText ? true : false;

                let errorJson: Object = {};
                if (part.errorText) {
                  try {
                    errorJson = JSON.parse(part.errorText || '{}');
                  } catch (error) {
                    console.error('❌ Failed to parse error text:', error);
                  }
                }

                const toolName = part.type.replace('tool-', '');
                contentParts.push({
                  type: 'tool-call' as const,
                  toolCallId: part.toolCallId || '',
                  toolName: toolName,
                  args: part.input || {},
                  argsText: JSON.stringify(part.input || {}, null, 2),
                  result: part.output || errorJson,
                  isError: hasError,
                });
              }
            });
          }

          const content: ThreadMessageLike['content'] = contentParts;

          // Use metadata timestamp if available, fallback to message timestamp or current time
          const timestamp =
            msg.metadata?.backend?.timestamp ||
            (
              (msg as any).parts?.[0]?.providerMetadata ||
              (msg as any).parts?.[0]?.callProviderMetadata
            )?.backend?.timestamp ||
            new Date().toISOString();

          return {
            id: msg.id,
            role: msg.role,
            content,
            createdAt: new Date(timestamp),
          } satisfies ThreadMessageLike;
        });

        return threadMessages;
      }

      return [];
    } catch (error) {
      console.error('❌ Failed to load conversation history:', error);
      return [];
    }
  },

  loadConversationHistoryAndSwitch: async (conversationId: string) => {
    const threadMessages = await get().loadConversationHistory(conversationId);

    if (threadMessages.length > 0) {
      const { conversationList } = get();

      // Update the conversation with loaded messages
      const newConversationList = conversationList.map((conv) => {
        if (conv.threadId === conversationId) {
          return { ...conv, messages: threadMessages };
        }
        return conv;
      });

      // Add to conversation list if not exists
      const existingConversation = newConversationList.find((c) => c.threadId === conversationId);

      if (!existingConversation) {
        const firstMessage = threadMessages[0];
        const title =
          firstMessage &&
          typeof firstMessage.content[0] === 'object' &&
          'text' in firstMessage.content[0]
            ? firstMessage.content[0].text.substring(0, 50) || 'Yeni Konuşma'
            : 'Yeni Konuşma';

        newConversationList.push({
          threadId: conversationId,
          status: 'regular' as const,
          title,
          lastUpdated: new Date(),
          messages: threadMessages,
        });
      }

      set({
        conversationList: newConversationList,
        currentConversationId: conversationId,
      });
    }
  },

  // Helper methods
  getCurrentConversation: () => {
    const { currentConversationId, conversationList } = get();
    if (!currentConversationId) return null;
    return conversationList.find((c) => c.threadId === currentConversationId) || null;
  },

  getConversationMessages: (conversationId: string) => {
    const { conversationList } = get();
    const conversation = conversationList.find((c) => c.threadId === conversationId);
    return conversation?.messages || [];
  },
});
