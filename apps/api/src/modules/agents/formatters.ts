import type { Agent, AgentDomain, FileLibraryAsset } from "@onlyjs/db/client";
import { BaseFormatter } from "../../utils";
import { agentRagFileResponseDto, agentResponseDto, chatbotConfigDto } from "./dtos";
import type { AgentRagFileShowResponse, AgentShowResponse, ChatbotConfig } from "./types";
import { WidgetPosition } from "./types";

export abstract class AgentFormatter {
  static response(data: Agent & { domains: AgentDomain[] }) {
    const convertedData = BaseFormatter.convertData<AgentShowResponse>(
      {
        ...data,
        whatsappIntegrationConfig: data.whatsappIntegrationConfig || {
          phoneNumberId: "",
          accessToken: "",
          businessAccountId: "",
          appId: "",
          webhookVerifyToken: "",
          isEnabled: false,
        },
        chatbotInstructions: data.chatbotInstructions || {
          voiceTone: "",
          welcomeMessage: "",
          aboutUs: "",
        },
        chatbotConfig: data.chatbotConfig || {
          chatbotName: "",
          chatbotImage: "",
          widgetPosition: WidgetPosition.RIGHT,
          primaryColor: "#3B82F6",
          secondaryColor: "#EFF6FF",
          backgroundColor: "#FFFFFF",
          textColor: "#1F2937",
          borderRadius: 12,
        },
        domains: data.domains.map((domain) => ({
          uuid: domain.uuid,
          domain: domain.domain,
          isEnabled: domain.isEnabled,
        })),
      },
      agentResponseDto
    );
    return convertedData;
  }

  static configResponse(chatbotConfig: ChatbotConfig) {
    const convertedData = BaseFormatter.convertData<ChatbotConfig>(
      {
        ...chatbotConfig,
      },
      chatbotConfigDto
    );
    return convertedData;
  }

  static ragFileResponse(data: FileLibraryAsset) {
    const convertedData = BaseFormatter.convertData<AgentRagFileShowResponse>(
      {
        ...data,
        size: data.size.toString()
      },
      agentRagFileResponseDto
    );
    return convertedData;
  }
}
