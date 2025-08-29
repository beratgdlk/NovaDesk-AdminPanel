import { DEFAULT_LLM_MODEL, LLM_SELECT_OPTIONS } from "#/config/llm";
import { Thread } from "#components/assistant-ui/thread";
import { ThreadList } from "#components/assistant-ui/thread-list";
import { SelectDropdown } from "#components/select-dropdown";
import { AssistantUIRuntimeProvider } from "#context/assistant-ui-runtime-provider.tsx";
import { getCookie, setCookie } from "#lib/utils";
import { useChatStore } from "#stores/chat-store";
import { useState } from "react";
import { GetCurrentCustomerProposalsUI } from "./custom-ui/GetCurrentCustomerProposalsUI";
import { RenderPreInfoPDFUI, RenderProposalPDFUI } from "./custom-ui/RenderPDFUI";

export function CustomChat() {
    const { currentConversationId, conversationList } = useChatStore();

    // LLM model state
    const [selectedModel, setSelectedModel] = useState<string>(() => {
        // Cookie'den model seçimini oku, yoksa default model'i kullan
        return getCookie("selected-llm-model") ?? DEFAULT_LLM_MODEL;
    });

    // Model değiştiğinde cookie'ye kaydet
    const handleModelChange = (model: string) => {
        setSelectedModel(model);
        setCookie("selected-llm-model", model);
    };

    return (
        <AssistantUIRuntimeProvider>
            <div className="flex h-full w-full">
                {/* Thread List Sidebar */}
                <div className="w-80 h-full border-r border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-col">
                    <div className="p-4 border-b border-border flex-shrink-0">
                        <h2 className="text-lg font-semibold mb-4">
                            Konuşmalar
                        </h2>

                        {/* Model Selection */}
                        <div className="mb-4">
                            <label className="text-sm font-medium mb-2 block">
                                AI Model
                            </label>
                            <SelectDropdown
                                items={LLM_SELECT_OPTIONS}
                                defaultValue={selectedModel}
                                onValueChange={handleModelChange}
                                placeholder="Model seçin"
                                isControlled={true}
                            />
                        </div>
                    </div>

                    {/* Thread List */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <ThreadList />
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col">
                    {currentConversationId ? (
                        <Thread />
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <h3 className="text-xl font-semibold mb-2">
                                    Hoşgeldiniz
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    Yeni bir konuşma başlatmak için sol
                                    taraftaki "Yeni Konuşma" butonuna tıklayın
                                </p>
                                <div className="text-sm text-muted-foreground">
                                    <p>
                                        Seçili Model:{" "}
                                        <strong>{selectedModel}</strong>
                                    </p>
                                    <p className="mt-1">
                                        {conversationList.length > 0
                                            ? `${conversationList.length} konuşma mevcut`
                                            : "Henüz konuşma yok"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* <GetCurrentCustomerInfoUI /> */}
            <GetCurrentCustomerProposalsUI />
            <RenderPreInfoPDFUI />
            <RenderProposalPDFUI />
        </AssistantUIRuntimeProvider>
    );
}
