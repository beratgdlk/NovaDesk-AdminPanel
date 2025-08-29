import type { StateCreator } from 'zustand';

// Mapping types
export type MessageIdMapping = Map<string, string>;
export type ConversationIdMapping = Map<string, string>;

// Mapping slice state
export interface MappingSliceState {
  messageIdMapping: MessageIdMapping;
  conversationIdMapping: ConversationIdMapping;
}

// Mapping slice actions
export interface MappingSliceActions {
  // Message ID mapping
  addMessageIdMapping: (frontendId: string, backendId: string) => void;

  // Conversation ID mapping
  getBackendConversationId: (frontendId: string) => string | null;
  addConversationIdMapping: (frontendId: string, backendId: string) => void;

  // Reset mapping
  resetMappings: () => void;
}

// Combined mapping slice type
export type MappingSlice = MappingSliceState & MappingSliceActions;

// Mapping slice creator
export const createMappingSlice: StateCreator<MappingSlice, [], [], MappingSlice> = (set, get) => ({
  // Initial state
  messageIdMapping: new Map(),
  conversationIdMapping: new Map(),

  addMessageIdMapping: (frontendId: string, backendId: string) => {
    const { messageIdMapping } = get();
    const newMapping = new Map(messageIdMapping);
    newMapping.set(frontendId, backendId);
    set({ messageIdMapping: newMapping });
  },

  // Conversation ID mapping actions
  getBackendConversationId: (frontendId: string) => {
    // First check mapping
    const mappedId = get().conversationIdMapping.get(frontendId);
    if (mappedId) {
      return mappedId;
    }

    // If no mapping but frontendId is UUID format (backend conversation ID), return it
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(frontendId)) {
      return frontendId;
    }

    return null;
  },

  addConversationIdMapping: (frontendId: string, backendId: string) => {
    const { conversationIdMapping } = get();
    const newMapping = new Map(conversationIdMapping);
    newMapping.set(frontendId, backendId);
    set({ conversationIdMapping: newMapping });
  },

  // Reset all mappings
  resetMappings: () => {
    set({
      messageIdMapping: new Map(),
      conversationIdMapping: new Map(),
    });
  },
});
