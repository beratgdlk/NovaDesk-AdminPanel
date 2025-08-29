import { cn } from "#/lib/utils";
import { Thread } from "#components/assistant-ui/thread.tsx";
import { GetCurrentCustomerInfoUI } from "#components/chat/custom-ui/GetCurrentCustomerInfoUI.tsx";
import { GetCurrentCustomerProposalsUI } from "#components/chat/custom-ui/GetCurrentCustomerProposalsUI.tsx";
import {
    RenderPreInfoPDFUI,
    RenderProposalPDFUI,
} from "#components/chat/custom-ui/RenderPDFUI.tsx";
import { AssistantUIRuntimeProvider } from "#context/assistant-ui-runtime-provider.tsx";
import { useChatbotContext } from "./chatbot-context";
import { ChatbotWindowHeader } from "./chatbot-window-header";

interface ChatbotWindowProps {
    className?: string;
    children?: React.ReactNode;
    isPreviewMode?: boolean; // New prop for preview mode
}

export function ChatbotWindow({
    className,
    children,
    isPreviewMode = false,
}: ChatbotWindowProps) {
    const {
        config,
        state,

        getWidgetPositionClasses,
        getBorderRadiusValue,
    } = useChatbotContext();

    // In preview mode, always show the window
    if (!isPreviewMode && !state.isOpen) return null;

    const getPositionClasses = () => {
        // Preview mode: static positioning (same size as normal mode)
        if (isPreviewMode) {
            return "relative w-80 h-96 md:w-96 md:h-[500px]";
        }

        // Normal mode: fixed positioning
        const position = getWidgetPositionClasses();

        if (state.isLargeMode) {
            // Large mode should respect the widget position
            switch (position) {
                case "bottom-left":
                    return "fixed inset-x-0 bottom-0 h-[75vh] md:inset-x-4 md:bottom-4 md:h-[80vh] md:max-h-[700px] lg:bottom-6 lg:left-6 lg:right-auto lg:w-[480px] lg:h-[650px] xl:w-[520px] xl:h-[700px]";
                case "bottom-right":
                default:
                    return "fixed inset-x-0 bottom-0 h-[75vh] md:inset-x-4 md:bottom-4 md:h-[80vh] md:max-h-[700px] lg:bottom-6 lg:right-6 lg:left-auto lg:w-[480px] lg:h-[650px] xl:w-[520px] xl:h-[700px]";
            }
        }

        switch (position) {
            case "bottom-left":
                return "fixed inset-x-0 bottom-0 h-[60vh] md:inset-x-4 md:bottom-4 md:h-[70vh] md:max-h-[500px] lg:bottom-6 lg:left-6 lg:right-auto lg:w-[380px] lg:h-[480px] xl:w-[420px] xl:h-[520px]";
            case "bottom-right":
            default:
                return "fixed inset-x-0 bottom-0 h-[60vh] md:inset-x-4 md:bottom-4 md:h-[70vh] md:max-h-[500px] lg:bottom-6 lg:right-6 lg:left-auto lg:w-[380px] lg:h-[480px] xl:w-[420px] xl:h-[520px]";
        }
    };

    return (
        <div
            className={cn(
                "shadow-2xl border transition-all duration-500 ease-in-out",
                !isPreviewMode &&
                    "z-50 animate-in fade-in-0 slide-in-from-bottom-2",
                getPositionClasses(),
                className
            )}
            style={{
                backgroundColor: config.backgroundColor,
                borderRadius: getBorderRadiusValue(),
            }}
        >
            <div className="flex flex-col h-full">
                {/* Header */}
                <ChatbotWindowHeader isPreviewMode={isPreviewMode} />

                {/* Content Area - Fixed height with overflow handling */}
                <div className="flex-1 min-h-0 overflow-hidden">
                    {children || (
                        <AssistantUIRuntimeProvider>
                            <Thread chatbotConfig={config} />
                            <GetCurrentCustomerInfoUI />
                            <GetCurrentCustomerProposalsUI />
                            <RenderPreInfoPDFUI />
                            <RenderProposalPDFUI />
                        </AssistantUIRuntimeProvider>
                    )}
                </div>
            </div>
        </div>
    );
}
