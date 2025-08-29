import type { AppendMessage, ThreadMessageLike } from '@assistant-ui/react';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Import slice types and creators
import type { ConversationSlice } from './slices/conversation-slice.ts';
import { createConversationSlice } from './slices/conversation-slice.ts';
import type { MappingSlice } from './slices/mapping-slice.ts';
import { createMappingSlice } from './slices/mapping-slice.ts';
import type { MessageSlice } from './slices/message-slice.ts';
import { createMessageSlice } from './slices/message-slice.ts';
import type { StreamCallbacks, StreamSlice } from './slices/stream-slice.ts';
import { createStreamSlice } from './slices/stream-slice.ts';

// Combined store interface
interface ChatStore extends ConversationSlice, MessageSlice, MappingSlice, StreamSlice {
  // Override streamMessage to hide callback implementation details
  streamMessage: (message: AppendMessage) => Promise<void>;

  // Global reset
  reset: () => void;
}

// Create the store
export const useChatStore = create<ChatStore>()(
  subscribeWithSelector((set, get) => {
    // Create individual slices
    const conversationSlice = createConversationSlice(set, get, {} as any);
    const messageSlice = createMessageSlice(set, get, {} as any);
    const mappingSlice = createMappingSlice(set, get, {} as any);
    const streamSlice = createStreamSlice(set, get, {} as any);

    // Enhanced streamMessage - coordinates between slices
    const enhancedStreamMessage = async (message: AppendMessage) => {
      const store = get();

      // Ensure we have a current conversation
      let activeConversationId = store.currentConversationId;
      if (!activeConversationId) {
        activeConversationId = store.createNewConversation();
        set({ currentConversationId: activeConversationId });
      }

      // Create callbacks for stream slice
      const callbacks: StreamCallbacks = {
        // Message actions - coordinate between message slice and conversation slice
        addMessage: (message: ThreadMessageLike) => {
          const state = get();
          if (state.currentConversationId) {
            // Add to message slice (for UI)
            state.addMessage(message);
            // Add to conversation slice (for persistence)
            state.addMessageToConversation(state.currentConversationId, message);
          }
        },

        updateMessage: (id: string, updater: (message: ThreadMessageLike) => ThreadMessageLike) => {
          const state = get();
          if (state.currentConversationId) {
            // Update in message slice (for UI)
            state.updateMessage(id, updater);
            // Update in conversation slice (for persistence)
            state.updateMessageInConversation(state.currentConversationId, id, updater);
          }
        },

        setIsRunning: (isRunning: boolean) => {
          set({ isRunning });
        },

        // ID mapping actions
        addMessageIdMapping: store.addMessageIdMapping,
        addConversationIdMapping: (frontendId: string, backendId: string) => {
          // Add mapping
          store.addConversationIdMapping(frontendId, backendId);

          // Replace frontend conversation with backend conversation
          const state = get();
          const frontendConversation = state.conversationList.find(
            (c) => c.threadId === frontendId,
          );

          if (frontendConversation) {
            // Replace in conversationList
            const newConversationList = state.conversationList.map((c) =>
              c.threadId === frontendId
                ? { ...c, threadId: backendId, lastUpdated: c.lastUpdated || new Date() }
                : c,
            );

            // Update current conversation ID if it was the frontend conversation
            const newCurrentConversationId =
              state.currentConversationId === frontendId ? backendId : state.currentConversationId;

            set({
              conversationList: newConversationList,
              currentConversationId: newCurrentConversationId,
            });
          }
        },

        // Navigation actions
        refreshConversationList: store.refreshConversationList,

        // Context getter
        getContext: () => {
          const state = get();
          const conversationId = state.currentConversationId;

          // Check if this is a new conversation
          let isNewConversation = !conversationId || conversationId.startsWith('conversation-');

          // If we have a backend mapping for this conversation, it's no longer new
          if (conversationId && store.getBackendConversationId(conversationId)) {
            isNewConversation = false;
          }

          const backendConversationId = conversationId
            ? store.getBackendConversationId(conversationId)
            : null;

          return {
            currentConversationId: conversationId,
            isNewConversation,
            backendConversationId,
          };
        },
      };

      // Call stream slice with callbacks
      await streamSlice.streamMessage(message, callbacks);

      // Update lastUpdated for current conversation after stream completion
      const finalState = get();
      const currentConversation = finalState.getCurrentConversation();
      if (currentConversation) {
        const updatedConversation = { ...currentConversation, lastUpdated: new Date() };
        const newConversationList = finalState.conversationList.map((conv) =>
          conv.threadId === currentConversation.threadId ? updatedConversation : conv,
        );

        set({ conversationList: newConversationList });
      }
    };

    // Enhanced conversation switching - sync messages with conversation
    const enhancedSwitchToConversation = (conversationId: string) => {
      const store = get();
      const messages = store.getConversationMessages(conversationId);

      set({
        currentConversationId: conversationId,
        messages, // ✅ Sync messages from conversation
      });
    };

    // Enhanced conversation creation - also clear messages
    const enhancedCreateNewConversation = () => {
      const conversationId = conversationSlice.createNewConversation();
      set({ messages: [] }); // ✅ Clear messages for new conversation
      return conversationId;
    };

    // Enhanced delete conversation - simplified
    const enhancedDeleteConversation = (conversationId: string) => {
      const state = get();

      // If we're deleting the current conversation, we need to update messages too
      const wasCurrentConversation = state.currentConversationId === conversationId;

      // Delete the conversation
      conversationSlice.deleteConversation(conversationId);

      // If it was current conversation, sync messages with new current conversation
      if (wasCurrentConversation) {
        const newState = get();
        if (newState.currentConversationId) {
          const newMessages = newState.getConversationMessages(newState.currentConversationId);
          set({ messages: newMessages });
        }
      }
    };

    // Enhanced load conversation history and switch - also sync messages
    const enhancedLoadConversationHistoryAndSwitch = async (conversationId: string) => {
      await conversationSlice.loadConversationHistoryAndSwitch(conversationId);

      // Sync messages with loaded conversation
      const state = get();
      const messages = state.getConversationMessages(conversationId);
      set({ messages, currentConversationId: conversationId });
    };

    // Global reset
    const reset = () => {
      set({
        // Conversation slice state
        currentConversationId: null,
        conversationList: [],
        backendConversationList: [],
        refreshTrigger: 0,

        // Message slice state
        messages: [],
        isRunning: false,

        // Mapping slice state
        messageIdMapping: new Map(),
        conversationIdMapping: new Map(),
      });
    };

    // Combine all slices with enhanced actions
    return {
      ...conversationSlice,
      ...messageSlice,
      ...mappingSlice,
      ...streamSlice,

      // Enhanced actions
      streamMessage: enhancedStreamMessage,
      switchToConversation: enhancedSwitchToConversation,
      createNewConversation: enhancedCreateNewConversation,
      deleteConversation: enhancedDeleteConversation,
      loadConversationHistoryAndSwitch: enhancedLoadConversationHistoryAndSwitch,
      reset,
    };
  }),
);
