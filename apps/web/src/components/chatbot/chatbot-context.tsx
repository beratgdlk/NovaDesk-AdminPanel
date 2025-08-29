import {
  ChatbotConfig,
  WidgetPosition,
} from "#backend/modules/agents/types.ts";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// Chatbot state interface
export interface ChatbotState {
  isOpen: boolean;
  isLargeMode: boolean;
  isLoading: boolean;
}

// Context interface
interface ChatbotContextType {
  // Configuration
  config: ChatbotConfig;

  // State
  state: ChatbotState;

  // Actions
  openChat: () => void;
  closeChat: () => void;
  toggleSize: () => void;
  setLoading: (loading: boolean) => void;
  updateConfig: (config: Partial<ChatbotConfig>) => void;

  // Computed values
  getWidgetPositionClasses: () => string;
  getBorderRadiusValue: () => string;
}

// Default configuration values matching the API defaults
const defaultConfig: ChatbotConfig = {
  chatbotName: "Chatbot",
  chatbotImage: "",
  widgetPosition: WidgetPosition.RIGHT,
  primaryColor: "#3B82F6",
  secondaryColor: "#EFF6FF",
  backgroundColor: "#FFFFFF",
  textColor: "#1F2937",
  borderRadius: 12,
};

const defaultState: ChatbotState = {
  isOpen: false,
  isLargeMode: false,
  isLoading: false,
};

// Create context
const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

// Provider props
interface ChatbotProviderProps {
  children: ReactNode;
  initialConfig?: Partial<ChatbotConfig & { chatbotImageFile?: File }>;
}

// Provider component
export function ChatbotProvider({
  children,
  initialConfig = {},
}: ChatbotProviderProps) {
  const [config, setConfig] = useState<ChatbotConfig>({
    ...defaultConfig,
    ...initialConfig,
  });

  const [state, setState] = useState<ChatbotState>(defaultState);

  // Update config when initialConfig changes
  useEffect(() => {
    const { chatbotImageFile, ...rest } = initialConfig;
    const chatbotImage = chatbotImageFile
      ? URL.createObjectURL(chatbotImageFile)
      : rest.chatbotImage;
    setConfig(() => ({
      ...defaultConfig,
      ...rest,
      chatbotImage,
    }));
  }, [initialConfig]);

  // Actions
  const openChat = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: true }));
  }, []);

  const closeChat = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false, isLargeMode: false }));
  }, []);

  const toggleSize = useCallback(() => {
    setState((prev) => ({ ...prev, isLargeMode: !prev.isLargeMode }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, isLoading: loading }));
  }, []);

  const updateConfig = useCallback((newConfig: Partial<ChatbotConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  // Computed values
  const getWidgetPositionClasses = useCallback(() => {
    switch (config.widgetPosition) {
      case WidgetPosition.LEFT:
        return "bottom-left";
      case WidgetPosition.LEFT_CENTER:
        return "bottom-left";
      case WidgetPosition.RIGHT_CENTER:
        return "bottom-right";
      case WidgetPosition.RIGHT:
      default:
        return "bottom-right";
    }
  }, [config.widgetPosition]);

  const getBorderRadiusValue = useCallback(() => {
    return `${config.borderRadius || 12}px`;
  }, [config.borderRadius]);

  const contextValue: ChatbotContextType = {
    config,
    state,
    openChat,
    closeChat,
    toggleSize,
    setLoading,
    updateConfig,
    getWidgetPositionClasses,
    getBorderRadiusValue,
  };

  return (
    <ChatbotContext.Provider value={contextValue}>
      {children}
    </ChatbotContext.Provider>
  );
}

// Hook to use the context
export function useChatbotContext() {
  const context = useContext(ChatbotContext);
  if (context === undefined) {
    throw new Error("useChatbotContext must be used within a ChatbotProvider");
  }
  return context;
}

// Hook to get chatbot configuration
export function useChatbotConfig() {
  const { config } = useChatbotContext();
  return config;
}

// Hook to get chatbot state
export function useChatbotState() {
  const { state } = useChatbotContext();
  return state;
}
