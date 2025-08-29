"use client";

import {
    type AppendMessage,
    AssistantRuntimeProvider,
    type ThreadMessageLike,
    useExternalStoreRuntime,
} from "@assistant-ui/react";
import { useCallback, useEffect, useMemo } from "react";
import { useChatStore } from "#stores/chat-store.ts";

export function AssistantUIRuntimeProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    // Get chat store state and actions - updated method names
    const {
        currentConversationId,
        conversationList,
        messages,
        isRunning,
        refreshTrigger,
        setMessages,
        streamMessage,
        createNewConversation,
        switchToConversation,
        renameConversation,
        archiveConversation,
        deleteConversation,
        loadConversationHistoryAndSwitch,
        loadConversationHistory,
        updateConversationMessages,
        fetchConversationList,
    } = useChatStore();

    // Initialize conversation list on mount
    useEffect(() => {
        fetchConversationList();
    }, [fetchConversationList, refreshTrigger]);

    // Create thread list adapter - updated to use conversation methods
    const threadListAdapter = useMemo(() => {
        // Filter and sort by lastUpdated (newest first)
        const regularConversations = conversationList
            .filter((c) => c.status === "regular")
            .sort((a, b) => {
                const dateA = a.lastUpdated || new Date(0);
                const dateB = b.lastUpdated || new Date(0);
                return dateB.getTime() - dateA.getTime(); // ✅ Newest first
            });

        const archivedConversations = conversationList
            .filter((c) => c.status === "archived")
            .sort((a, b) => {
                const dateA = a.lastUpdated || new Date(0);
                const dateB = b.lastUpdated || new Date(0);
                return dateB.getTime() - dateA.getTime(); // ✅ Newest first
            });

        return {
            threadId: currentConversationId || undefined,
            threads: regularConversations.map((c) => ({
                threadId: c.threadId,
                title: c.title,
                status: "regular" as const,
            })),
            archivedThreads: archivedConversations.map((c) => ({
                threadId: c.threadId,
                title: c.title,
                status: "archived" as const,
            })),

            onSwitchToNewThread: () => {
                createNewConversation();
            },

            onSwitchToThread: (conversationId: string) => {
                // Always switch to conversation first (if exists)
                const existingConversation = conversationList.find(
                    (c) => c.threadId === conversationId
                );
                
                if (existingConversation) {
                    // If no messages, load them first, then switch
                    if (existingConversation.messages.length === 0) {
                        loadConversationHistory(conversationId).then((messages: any[]) => {
                            if (messages.length > 0) {
                                // Update conversation with loaded messages
                                updateConversationMessages(conversationId, messages);
                                // Switch after messages are loaded
                                switchToConversation(conversationId);
                            } else {
                                // No messages from backend, just switch
                                switchToConversation(conversationId);
                            }
                        });
                    } else {
                        // Conversation exists and has messages, just switch
                        switchToConversation(conversationId);
                    }
                } else {
                    // Conversation doesn't exist, load from API
                    loadConversationHistoryAndSwitch(conversationId);
                }
            },

            onRename: (conversationId: string, newTitle: string) => {
                renameConversation(conversationId, newTitle);
            },

            onArchive: (conversationId: string) => {
                archiveConversation(conversationId);
            },

            onUnarchive: (conversationId: string) => {
                // Unarchive by setting status back to regular
                const { conversationList } = useChatStore.getState();
                const newConversationList = conversationList.map((conv) =>
                    conv.threadId === conversationId
                        ? { ...conv, status: "regular" as const }
                        : conv
                );
                useChatStore.setState({
                    conversationList: newConversationList,
                });
            },

            onDelete: (conversationId: string) => {
                deleteConversation(conversationId);
            },
        };
    }, [
        currentConversationId,
        conversationList,
        createNewConversation,
        switchToConversation,
        renameConversation,
        archiveConversation,
        deleteConversation,
        loadConversationHistoryAndSwitch,
    ]);

    // Create stable onNew callback
    const onNew = useCallback(
        async (message: AppendMessage) => {
            await streamMessage(message);
        },
        [streamMessage]
    );

    // Create stable setMessages callback
    const onSetMessages = useCallback(
        (newMessages: ThreadMessageLike[]) => {
            setMessages(newMessages);
        },
        [setMessages]
    );

    const runtime = useExternalStoreRuntime({
        messages,
        isRunning,
        onNew,
        setMessages: onSetMessages,
        convertMessage: (message: ThreadMessageLike) => message, // Identity function since we already use ThreadMessageLike
        adapters: {
            threadList: threadListAdapter,
        },
    });

    return (
        <AssistantRuntimeProvider runtime={runtime}>
            {children}
        </AssistantRuntimeProvider>
    );
}
