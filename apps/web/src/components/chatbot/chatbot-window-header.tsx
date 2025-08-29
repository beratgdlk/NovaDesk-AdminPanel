import { Button } from '#/components/ui/button';
import { getAsset } from '#lib/asset.ts';
import { Maximize2, MessageCircle, Minimize2, X } from 'lucide-react';
import { useChatbotContext } from './chatbot-context';

interface ChatbotWindowHeaderProps {
  isPreviewMode?: boolean;
}

export function ChatbotWindowHeader({ isPreviewMode = false }: ChatbotWindowHeaderProps) {
  const { 
    config, 
    state, 
    closeChat, 
    toggleSize, 
    getBorderRadiusValue 
  } = useChatbotContext();

  return (
    <div
      className="flex items-center justify-between border-b p-3 text-white transition-all duration-500 ease-in-out"
      style={{
        backgroundColor: config.primaryColor,
        borderRadius: `${getBorderRadiusValue()} ${getBorderRadiusValue()} 0 0`,
      }}
    >
      <div className="flex items-center space-x-2">
        {config.chatbotImage ? (
          <img
            src={getAsset(config.chatbotImage)}
            alt="Chatbot"
            className="h-5 w-5 rounded-full object-cover"
          />
        ) : (
          <MessageCircle className="h-5 w-5" />
        )}
        <h3 className="font-semibold text-sm">{config.chatbotName}</h3>
      </div>
      
      <div className="flex items-center space-x-1">
        {/* Size toggle button - only show on desktop and not in preview mode */}
        {!isPreviewMode && (
          <Button
            onClick={toggleSize}
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-white hover:bg-white/20 hidden md:flex"
            title={state.isLargeMode ? 'Normal boyuta geç' : 'Büyük boyuta geç'}
          >
            {state.isLargeMode ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        )}
        
        {/* Close button - only show when not in preview mode */}
        {!isPreviewMode && (
          <Button
            onClick={closeChat}
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-white hover:bg-white/20"
            title="Kapat"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        

      </div>
    </div>
  );
} 