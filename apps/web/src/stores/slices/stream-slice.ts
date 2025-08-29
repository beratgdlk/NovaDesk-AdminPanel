import type { AppendMessage, TextMessagePart, ThreadMessageLike } from '@assistant-ui/react';
import { generateId } from 'ai';
import type { StateCreator } from 'zustand';
import { api } from '#lib/api.ts';
import type {
  ConversationErrorData,
  NewConversationData,
  StreamDataEvent,
  UserMessageData,
} from '#types/chat.types.ts';

// Context interface for stream handling
interface StreamContext {
  currentConversationId: string | null;
  isNewConversation: boolean;
  backendConversationId: string | null;
}

// Simplified callback interfaces - split into logical groups
interface MessageCallbacks {
  addMessage: (message: ThreadMessageLike) => void;
  updateMessage: (id: string, updater: (message: ThreadMessageLike) => ThreadMessageLike) => void;
}

interface MappingCallbacks {
  addMessageIdMapping: (frontendId: string, backendId: string) => void;
  addConversationIdMapping: (frontendId: string, backendId: string) => void;
}

interface StateCallbacks {
  setIsRunning: (isRunning: boolean) => void;
  refreshConversationList: () => void;
  getContext: () => StreamContext;
}

export interface StreamCallbacks extends MessageCallbacks, MappingCallbacks, StateCallbacks {}

// Helper functions
const addTextContent = (
  existingContent: ThreadMessageLike['content'],
  delta: string,
): ThreadMessageLike['content'] => {
  if (!Array.isArray(existingContent)) return existingContent;

  const content = [...(existingContent as Exclude<ThreadMessageLike['content'], string>)];
  const textIndex = content.findIndex((part) => part.type === 'text');

  if (textIndex >= 0) {
    // Update existing text
    const textPart = content[textIndex] as TextMessagePart;
    const currentText = textPart?.text || '';
    content[textIndex] = { type: 'text', text: currentText + delta };
  } else {
    // Add new text
    content.push({ type: 'text', text: delta });
  }

  return content;
};

const findToolCallIndex = (content: ThreadMessageLike['content'], toolCallId: string): number => {
  if (!Array.isArray(content)) return -1;
  return content.findIndex((c: any) => c.toolCallId === toolCallId);
};

const updateToolCall = (
  content: ThreadMessageLike['content'],
  toolCallId: string,
  updater: (toolCall: any) => any,
): ThreadMessageLike['content'] => {
  if (!Array.isArray(content)) return content;

  const index = findToolCallIndex(content, toolCallId);
  if (index === -1) return content;

  const updatedContent = [...content];
  updatedContent[index] = updater(updatedContent[index]);
  return updatedContent;
};

// Type guards - simplified
const isUserMessageData = (data: unknown): data is UserMessageData => {
  return typeof data === 'object' && data !== null && 'messageId' in data;
};

const isNewConversationData = (data: unknown): data is NewConversationData => {
  return typeof data === 'object' && data !== null && 'conversationId' in data;
};

const isConversationErrorData = (data: unknown): data is ConversationErrorData => {
  return typeof data === 'object' && data !== null && 'message' in data;
};

// Stream slice
export interface StreamSlice {
  streamMessage: (message: AppendMessage, callbacks: StreamCallbacks) => Promise<void>;
}

export const createStreamSlice: StateCreator<StreamSlice, [], [], StreamSlice> = () => {
  // Event handler functions - defined outside to avoid 'this' issues
  const handleStreamEvent = async (
    data: StreamDataEvent,
    callbacks: StreamCallbacks,
    tempAssistantId: string,
    tempUserMessageId: string,
    context: StreamContext,
  ) => {
    const { currentConversationId, isNewConversation } = context;

    // Tool call event handlers
    const handleToolStart = (
      data: Extract<StreamDataEvent, { type: 'tool-input-start' }>,
      callbacks: StreamCallbacks,
      messageId: string,
    ) => {
      const { toolCallId, toolName } = data;
      if (!toolCallId) return;

      callbacks.updateMessage(messageId, (msg: ThreadMessageLike) => {
        // Check if this tool call already exists
        if (Array.isArray(msg.content)) {
          const existingToolCall = msg.content.find((part) => part.toolCallId === toolCallId);
          if (existingToolCall) {
            return msg; // Return unchanged
          }
        }

        const newContent = [
          ...(Array.isArray(msg.content) ? msg.content : []),
          {
            type: 'tool-call' as const,
            toolCallId,
            toolName: toolName || 'unknown_tool',
            args: {},
            argsText: '',
            result: undefined,
            isError: false,
          },
        ];

        return {
          ...msg,
          content: newContent,
        };
      });
    };

    const handleToolInputUpdate = (
      data: Extract<StreamDataEvent, { type: 'tool-input-available' }>,
      callbacks: StreamCallbacks,
      messageId: string,
    ) => {
      const { toolCallId, input } = data;
      if (!toolCallId) return;

      callbacks.updateMessage(messageId, (msg: ThreadMessageLike) => {
        const newContent = updateToolCall(msg.content, toolCallId, (toolCall: any) => ({
          ...toolCall,
          args: input,
          argsText: JSON.stringify(input, null, 2),
        }));

        return {
          ...msg,
          content: newContent,
        };
      });
    };

    const handleToolOutput = (
      data: Extract<StreamDataEvent, { type: 'tool-output-available' }>,
      callbacks: StreamCallbacks,
      messageId: string,
    ) => {
      const { toolCallId, output } = data;
      if (!toolCallId) return;

      callbacks.updateMessage(messageId, (msg: ThreadMessageLike) => {
        const newContent = updateToolCall(msg.content, toolCallId, (toolCall: any) => {
          return {
            ...toolCall,
            result: output,
            isError: false,
          };
        });

        return {
          ...msg,
          content: newContent,
        };
      });
    };

    switch (data.type) {
      // ID mapping events
      case 'data-user_message':
        if (isUserMessageData(data.data)) {
          const backendMessageId = data.data.messageId;
          callbacks.addMessageIdMapping(tempUserMessageId, backendMessageId);
          callbacks.addMessageIdMapping(tempAssistantId, `${backendMessageId}-assistant`);
        }
        break;

      case 'data-new_conversation':
        if (isNewConversationData(data.data) && isNewConversation && currentConversationId) {
          callbacks.addConversationIdMapping(currentConversationId, data.data.conversationId);
        }
        break;

      // Text streaming
      case 'text-delta':
        if (data.delta) {
          callbacks.updateMessage(tempAssistantId, (msg: ThreadMessageLike) => {
            const newContent = addTextContent(
              Array.isArray(msg.content) ? msg.content : [],
              data.delta!,
            );
            return {
              ...msg,
              content: newContent,
            };
          });
        }
        break;

      // Tool calls - unified handling
      case 'tool-input-start':
        handleToolStart(data, callbacks, tempAssistantId);
        break;

      case 'tool-input-available':
        handleToolInputUpdate(data, callbacks, tempAssistantId);
        break;

      case 'tool-output-available':
        handleToolOutput(data, callbacks, tempAssistantId);
        break;

      // Error handling
      case 'data-conversation_error':
        if (isConversationErrorData(data.data)) {
          const errorData = data.data as ConversationErrorData;
          callbacks.updateMessage(tempAssistantId, (msg: ThreadMessageLike) => ({
            ...msg,
            content: [{ type: 'text', text: `Hata: ${errorData.message}` }],
          }));
        }
        break;
    }
  };

  return {
    streamMessage: async (message: AppendMessage, callbacks: StreamCallbacks) => {
      // Initialize context
      const context = callbacks.getContext();
      const { currentConversationId, isNewConversation, backendConversationId } = context;

      // Add user message
      const tempUserMessageId = generateId();
      callbacks.addMessage({
        role: 'user',
        content: message.content,
        id: tempUserMessageId,
        createdAt: new Date(),
      });

      // Initialize assistant message
      callbacks.setIsRunning(true);
      const tempAssistantId = generateId();
      callbacks.addMessage({
        role: 'assistant',
        id: tempAssistantId,
        content: [], // Empty - tool calls will be added first
      });

      // Prepare API call
      const headers: Record<string, string> = {};
      if (!isNewConversation && currentConversationId && backendConversationId) {
        headers['x-conversation-id'] = backendConversationId;
      }

      try {
        const stream = api.chat.message.stream.post(
          { message: (message.content[0] as TextMessagePart).text },
          { headers },
        );

        const response = await stream;
        const streamData = response.data as unknown as AsyncIterable<string>;

        let streamBuffer = ''; // Complete stream buffer

        for await (const chunk of streamData) {
          // Add chunk to buffer
          streamBuffer += chunk;

          // Process all complete events in buffer
          let startIndex = 0;

          while (true) {
            // Find next "data: " at line start
            const dataIndex = streamBuffer.indexOf('\ndata: ', startIndex);
            const isFirstEvent = startIndex === 0 && streamBuffer.startsWith('data: ');

            let eventStart: number;
            if (isFirstEvent) {
              eventStart = 0;
            } else if (dataIndex === -1) {
              // No more complete events
              break;
            } else {
              eventStart = dataIndex + 1; // Skip the \n
            }

            // Find the end of this event (next \ndata: or \n\n or end of buffer)
            let eventEnd = -1;
            const searchFrom = eventStart + 5; // After "data: "

            // Look for next event start
            const nextDataIndex = streamBuffer.indexOf('\ndata: ', searchFrom);
            const doubleNewlineIndex = streamBuffer.indexOf('\n\n', searchFrom);

            if (
              nextDataIndex !== -1 &&
              (doubleNewlineIndex === -1 || nextDataIndex < doubleNewlineIndex)
            ) {
              eventEnd = nextDataIndex;
            } else if (doubleNewlineIndex !== -1) {
              eventEnd = doubleNewlineIndex;
            } else {
              // Event might be incomplete, wait for more data
              break;
            }

            // Extract the event data
            const eventText = streamBuffer.substring(eventStart, eventEnd);
            const dataMatch = eventText.match(/^data:\s*(.*)$/s);

            if (dataMatch) {
              const jsonStr = dataMatch[1].trim();

              if (jsonStr && jsonStr !== '[DONE]') {
                try {
                  const data: StreamDataEvent = JSON.parse(jsonStr);
                  await handleStreamEvent(
                    data,
                    callbacks,
                    tempAssistantId,
                    tempUserMessageId,
                    context,
                  );
                } catch (error) {
                  console.error('🚨 Stream parsing error:', error);
                }
              }
            }

            // Move to next event
            startIndex = eventEnd;
          }

          // Keep unprocessed part in buffer (potential incomplete event)
          if (startIndex > 0) {
            streamBuffer = streamBuffer.substring(startIndex);
          }
        }
      } catch (error) {
        callbacks.updateMessage(tempAssistantId, (msg: ThreadMessageLike) => ({
          ...msg,
          content: [{ type: 'text', text: 'Bir hata oluştu. Lütfen tekrar deneyin.' }],
        }));
      } finally {
        callbacks.setIsRunning(false);
        callbacks.refreshConversationList();
      }
    },
  };
};
