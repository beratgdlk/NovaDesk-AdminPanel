import {
    ChatMessage,
    type ChatMessageProps,
    type Message,
} from "#components/ui/chat-message";
import { LLMMessageRenderer } from "#components/chat/llm-message-renderer";
import { cn } from "#lib/utils";
import React from "react";

type AdditionalMessageOptions = Omit<ChatMessageProps, keyof Message>;

// Extended Message interface for tool calls and streaming
interface ExtendedMessage extends Message {
    isStreaming?: boolean;
    streamingComplete?: boolean;
    toolCalls?: Array<{
        id: string;
        name: string;
        arguments: any;
        type: string;
        status?: string;
        hasArguments?: boolean;
        error?: string;
    }>;
    toolResults?: Array<{
        id: string;
        name: string;
        result: any;
        status: string;
        error?: string;
    }>;
}

interface MessageListProps {
    messages: ExtendedMessage[];
    showTimeStamps?: boolean;
    isTyping?: boolean;
    streamingMessageId?: string | null;
    compactTools?: boolean;
    toolCollapseStates?: Record<string, boolean>;
    onToolCollapseChange?: (toolId: string, isOpen: boolean) => void;
    messageOptions?:
        | AdditionalMessageOptions
        | ((message: ExtendedMessage) => AdditionalMessageOptions);
}

// Streaming mesajlar için özel wrapper component
const StreamingMessageWrapper = ({
    message,
    isStreaming,
    children,
}: {
    message: ExtendedMessage;
    isStreaming: boolean;
    children: React.ReactNode;
}) => {
    if (!isStreaming) return <>{children}</>;

    return (
        <div className="relative">
            <div className="message-content-streaming">{children}</div>
        </div>
    );
};

export function MessageList({
    messages,
    showTimeStamps = true,
    isTyping = false,
    streamingMessageId = null,
    compactTools = false,
    toolCollapseStates = {},
    onToolCollapseChange,
    messageOptions,
}: MessageListProps) {
    // Process messages to merge tool calls with content messages
    const processedMessages = React.useMemo(() => {
        const processed: ExtendedMessage[] = [];

        for (let i = 0; i < messages.length; i++) {
            const currentMessage = messages[i];

            // Skip hidden messages
            if (currentMessage.isHidden) continue;

            // If this is a user message, add it directly
            if (currentMessage.role === "user") {
                processed.push(currentMessage);
                continue;
            }

            // If this is an assistant message
            if (currentMessage.role === "assistant") {
                // Collect sequential assistant messages
                const assistantSequence: ExtendedMessage[] = [currentMessage];
                let j = i + 1;

                // Collect subsequent assistant messages
                while (
                    j < messages.length &&
                    messages[j].role === "assistant" &&
                    !messages[j].isHidden
                ) {
                    assistantSequence.push(messages[j]);
                    j++;
                }

                // Group tool calls/results with content messages
                const contentMessages: ExtendedMessage[] = [];
                let pendingToolCalls: any[] = [];
                let pendingToolResults: any[] = [];

                for (const msg of assistantSequence) {
                    // Collect tool calls and results
                    if (msg.toolCalls && msg.toolCalls.length > 0) {
                        pendingToolCalls.push(...msg.toolCalls);
                    }
                    if (msg.toolResults && msg.toolResults.length > 0) {
                        pendingToolResults.push(...msg.toolResults);
                    }

                    // If this message has content, create a merged message
                    if (msg.content && msg.content.trim() !== "") {
                        const mergedMessage: ExtendedMessage = {
                            ...msg,
                            toolCalls: [...pendingToolCalls],
                            toolResults: [...pendingToolResults],
                        };
                        contentMessages.push(mergedMessage);

                        // Clear pending tool calls/results as they're now attached
                        pendingToolCalls = [];
                        pendingToolResults = [];
                    }
                }

                // If there are still pending tool calls/results without content,
                // create a message with just the tools
                if (
                    pendingToolCalls.length > 0 ||
                    pendingToolResults.length > 0
                ) {
                    const toolOnlyMessage: ExtendedMessage = {
                        ...assistantSequence[assistantSequence.length - 1],
                        content: "",
                        toolCalls: pendingToolCalls,
                        toolResults: pendingToolResults,
                    };
                    contentMessages.push(toolOnlyMessage);
                }

                // Add all content messages to processed
                processed.push(...contentMessages);

                // Skip the processed sequence
                i = j - 1;
            }
        }

        return processed;
    }, [messages]);

    // Filter messages that have something to show
    const visibleMessages = React.useMemo(() => {
        return processedMessages.filter((message) => {
            // For assistant messages, check if there's anything to render
            if (message.role === "assistant") {
                const hasContent =
                    message.content && message.content.trim() !== "";
                const hasToolCalls =
                    message.toolCalls && message.toolCalls.length > 0;
                const hasToolResults =
                    message.toolResults && message.toolResults.length > 0;
                const isStreamingMessage = streamingMessageId === message.id;

                return (
                    hasContent ||
                    hasToolCalls ||
                    hasToolResults ||
                    isStreamingMessage ||
                    message.isStreaming
                );
            }

            return true;
        });
    }, [processedMessages, streamingMessageId]);

    return (
        <div className="space-y-4 overflow-visible">
            {visibleMessages.map((message, index) => {
                const additionalOptions =
                    typeof messageOptions === "function"
                        ? messageOptions(message)
                        : messageOptions;

                const isStreamingMessage = streamingMessageId === message.id;

                return (
                    <div
                        key={index}
                        className={cn(
                            "transition-all duration-300 ease-out",
                            isStreamingMessage && "streaming-message"
                        )}
                    >
                        <StreamingMessageWrapper
                            message={message}
                            isStreaming={isStreamingMessage}
                        >
                            {message.role === "assistant" ? (
                                <div className="flex flex-col items-start">
                                    <div className="bg-muted text-foreground break-words rounded-lg p-3 text-sm sm:max-w-[70%]">
                                        <LLMMessageRenderer
                                            content={message.content}
                                            isStreaming={
                                                message.isStreaming ||
                                                isStreamingMessage
                                            }
                                            toolCalls={message.toolCalls || []}
                                            toolResults={
                                                message.toolResults || []
                                            }
                                            compactTools={compactTools}
                                            toolCollapseStates={
                                                toolCollapseStates
                                            }
                                            onToolCollapseChange={
                                                onToolCollapseChange
                                            }
                                        />
                                    </div>
                                    {showTimeStamps && message.createdAt && (
                                        <time
                                            dateTime={message.createdAt.toISOString()}
                                            className="mt-1 block px-1 text-xs opacity-50"
                                        >
                                            {(() => {
                                                const isToday =
                                                    message.createdAt.toDateString() ===
                                                    new Date().toDateString();
                                                const isYesterday = (() => {
                                                    const yesterday =
                                                        new Date();
                                                    yesterday.setDate(
                                                        yesterday.getDate() - 1
                                                    );
                                                    return (
                                                        message.createdAt.toDateString() ===
                                                        yesterday.toDateString()
                                                    );
                                                })();

                                                if (isToday) {
                                                    return message.createdAt.toLocaleTimeString(
                                                        "tr-TR",
                                                        {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        }
                                                    );
                                                } else if (isYesterday) {
                                                    return `Dün ${message.createdAt.toLocaleTimeString(
                                                        "tr-TR",
                                                        {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        }
                                                    )}`;
                                                } else {
                                                    return (
                                                        message.createdAt.toLocaleDateString(
                                                            "tr-TR",
                                                            {
                                                                day: "2-digit",
                                                                month: "2-digit",
                                                                year: "numeric",
                                                            }
                                                        ) +
                                                        " " +
                                                        message.createdAt.toLocaleTimeString(
                                                            "tr-TR",
                                                            {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            }
                                                        )
                                                    );
                                                }
                                            })()}
                                        </time>
                                    )}
                                </div>
                            ) : (
                                <ChatMessage
                                    showTimeStamp={showTimeStamps}
                                    {...message}
                                    {...additionalOptions}
                                />
                            )}
                        </StreamingMessageWrapper>
                    </div>
                );
            })}
        </div>
    );
}
