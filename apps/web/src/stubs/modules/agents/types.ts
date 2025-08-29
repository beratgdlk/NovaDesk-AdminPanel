export type AgentShowResponse = {
  uuid: string;
  name: string;
  insurupAgentId?: string;
  chatbotConfig?: ChatbotConfig;
  domains?: { domain: string; isEnabled: boolean }[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export type AgentUpdatePayload = {
  name?: string;
  insurupAgentId?: string;
  chatbotConfig?: string; // backend form-data stringified in UI
  chatbotImageFile?: File | null;
};

export enum WidgetPosition {
  LEFT = "LEFT",
  LEFT_CENTER = "LEFT_CENTER",
  RIGHT_CENTER = "RIGHT_CENTER",
  RIGHT = "RIGHT",
}

export type ChatbotConfig = {
  chatbotName?: string;
  chatbotImage?: string;
  widgetPosition?: WidgetPosition;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
};

