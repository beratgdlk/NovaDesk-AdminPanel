import type { ThreadMessageLike } from '@assistant-ui/react';
import type { StateCreator } from 'zustand';

// Message slice state
export interface MessageSliceState {
  messages: ThreadMessageLike[];
  isRunning: boolean;
}

// Message slice actions
export interface MessageSliceActions {
  // Message management
  addMessage: (message: ThreadMessageLike) => void;
  setMessages: (messages: ThreadMessageLike[]) => void;
  updateMessage: (id: string, updater: (message: ThreadMessageLike) => ThreadMessageLike) => void;

  // Stream state
  setIsRunning: (isRunning: boolean) => void;
}

// Combined message slice type
export type MessageSlice = MessageSliceState & MessageSliceActions;

// Simple message slice creator
export const createMessageSlice: StateCreator<MessageSlice, [], [], MessageSlice> = (set, get) => ({
  // Initial state
  messages: [],
  isRunning: false,

  // Message actions
  addMessage: (message) => {
    const { messages } = get();
    const newMessages = [...messages, message];
    set({ messages: newMessages });
  },

  setMessages: (messages) => {
    set({ messages });
  },

  updateMessage: (id: string, updater: (message: ThreadMessageLike) => ThreadMessageLike) => {
    const messages = get().messages;
    const messageIndex = messages.findIndex((message) => message.id === id);

    if (messageIndex !== -1) {
      const newMessages = [...messages];
      newMessages[messageIndex] = updater(newMessages[messageIndex]);
      set({ messages: newMessages });
    }
  },

  // Stream state
  setIsRunning: (isRunning) => {
    set({ isRunning });
  },
});
