import type { toUIMessageStream as toUIMessageStreamAiSdk } from '@ai-sdk/langchain';
import { ToolManager } from './services/tool-manager.service';

function createCallbacksTransformer(callbacks: any) {
  let aggregatedResponse = '';
  return new TransformStream({
    async start() {
      if (callbacks.onStart) await callbacks.onStart();
    },
    async transform(message, controller) {
      controller.enqueue(message);

      if (typeof message === 'string') {
        aggregatedResponse += message;
        if (callbacks.onToken) await callbacks.onToken(message);
        if (callbacks.onText) {
          await callbacks.onText(message);
        }
      }
    },
    async flush() {
      if (callbacks.onFinal) {
        await callbacks.onFinal(aggregatedResponse);
      }
    },
  });
}

type toUIMessageStreamParams = Parameters<typeof toUIMessageStreamAiSdk>;

export function toUIMessageStream(
  stream: toUIMessageStreamParams[0],
  callbacks: toUIMessageStreamParams[1],
): ReturnType<typeof toUIMessageStreamAiSdk> {
  return stream
    .pipeThrough(
      new TransformStream({
        transform: async (value, controller) => {
          var _a;
          if (typeof value === 'string') {
            controller.enqueue(value);
            return;
          }
          if ('event' in value) {
            if (value.event === 'on_chat_model_stream') {
              forwardAIMessageChunk((_a = value.data) == null ? void 0 : _a.chunk, controller);
            }
            if (value.event === 'on_tool_start') {
              const runId = value.run_id;
              const toolName = value.name;

              controller.enqueue({
                type: 'tool-input-start',
                toolCallId: runId,
                toolName,
              });
            }
            if (value.event === 'on_tool_end') {
              const toolData = value.data;

              const runId = value.run_id;
              const toolName = value.name;

              const input = toolData?.input?.input || {};
              controller.enqueue({
                type: 'tool-input-available',
                toolCallId: runId,
                toolName,
                input: typeof input === 'string' ? JSON.parse(input) : input,
              });

              if (toolData?.output?.content) {
                const processedContent = await applyFormatResponseMiddleware(
                  toolName,
                  toolData.output.content,
                );

                let outputContent;
                try {
                  outputContent =
                    typeof processedContent === 'string'
                      ? JSON.parse(processedContent)
                      : processedContent;
                } catch {
                  outputContent = processedContent;
                }

                controller.enqueue({
                  type: 'tool-output-available',
                  toolCallId: runId,
                  output: outputContent,
                });
              }
            }
            return;
          }
          forwardAIMessageChunk(value, controller);
        },
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      }) as any,
    )
    .pipeThrough(createCallbacksTransformer(callbacks))
    .pipeThrough(
      new TransformStream({
        start: async (controller) => {
          controller.enqueue({ type: 'text-start', id: '1' });
        },
        transform: async (chunk, controller) => {
          if (
            typeof chunk === 'object' &&
            chunk?.type &&
            typeof chunk.type === 'string' &&
            chunk.type.includes('tool-')
          ) {
            controller.enqueue(chunk);
            return;
          }

          if (typeof chunk === 'string') {
            controller.enqueue({ type: 'text-delta', delta: chunk, id: '1' });
          }
        },
        flush: async (controller) => {
          controller.enqueue({ type: 'text-end', id: '1' });
        },
      }),
    );
}
function forwardAIMessageChunk(chunk: any, controller: any) {
  if (typeof chunk.content === 'string') {
    controller.enqueue(chunk.content);
  } else {
    const content = chunk.content;
    for (const item of content) {
      if (item.type === 'text') {
        controller.enqueue(item.text);
      }
    }
  }
}

async function applyFormatResponseMiddleware(toolName: string, content: unknown): Promise<unknown> {
  try {
    // Context'i minimal olarak gönder - transformer'da session bilgisi yok
    const result = await ToolManager.executeMiddlewareHooks(
      'formatResponse',
      {
        sessionId: '',
        conversationId: undefined,
        toolName,
        arguments: {},
        timestamp: Date.now(),
      },
      content,
    );
    return result !== undefined ? result : content;
  } catch (error) {
    console.error('❌ FormatResponse middleware error in transformer:', error);
    return content; // Hata durumunda original content'i döndür
  }
}
