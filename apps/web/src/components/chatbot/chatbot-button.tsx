import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";
import { getAsset } from "#lib/asset.ts";
import { MessageCircle } from "lucide-react";
import { useChatbotContext } from "./chatbot-context";

interface ChatbotButtonProps {
  className?: string;
}

export function ChatbotButton({ className }: ChatbotButtonProps) {
  const { config, state, openChat, getBorderRadiusValue } = useChatbotContext();

  if (state.isOpen) return null;

  const getPositionClasses = () => {
    switch (config.widgetPosition) {
      case "LEFT":
        return "fixed bottom-6 left-6";
      case "LEFT_CENTER":
        return "fixed top-1/2 left-6 transform -translate-y-1/2";
      case "RIGHT_CENTER":
        return "fixed top-1/2 right-6 transform -translate-y-1/2";
      case "RIGHT":
      default:
        return "fixed bottom-6 right-6";
    }
  };

  return (
    <div className={cn("z-50", getPositionClasses())}>
      <Button
        onClick={openChat}
        size="lg"
        className={cn(
          "h-14 w-14 shadow-lg hover:shadow-xl transition-all duration-200 animate-in fade-in-0 text-white p-2",
          className
        )}
        style={{
          backgroundColor: config.primaryColor,
          borderRadius: getBorderRadiusValue(),
        }}
      >
        {config.chatbotImage ? (
          <img
            src={getAsset(config.chatbotImage)}
            alt="Chatbot"
            className="h-6 w-6 rounded-full object-cover"
          />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}
