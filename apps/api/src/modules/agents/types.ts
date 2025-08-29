import type { Static } from 'elysia';
import {
  agentCreateDto,
  agentCreatePayloadParsedDto,
  agentDomainDto,
  agentDomainParsedDto,
  agentRagFileCreatePayloadDto,
  agentRagFileIndexDto,
  agentRagFileResponseDto,
  agentRagFileUpdatePayloadDto,
  agentResponseDto,
  agentShowDto,
  agentUpdateDto,
  agentUpdatePayloadParsedDto,
  chatbotConfigDto,
  chatbotInstructionsDto,
  whatsappIntegrationConfigSchema
} from './dtos';

export enum WidgetPosition {
  LEFT = 'LEFT',
  LEFT_CENTER = 'LEFT_CENTER',
  RIGHT_CENTER = 'RIGHT_CENTER',
  RIGHT = 'RIGHT',
}

export type AgentCreatePayload = Static<(typeof agentCreateDto)['body']>;
export type AgentUpdatePayload = Static<(typeof agentUpdateDto)['body']>;
export type AgentShowParams = Static<(typeof agentShowDto)['params']>;
export type AgentShowResponse = Static<typeof agentResponseDto>;
export type AgentDestroyParams = AgentShowParams;

// Parsed versions without transforms (for internal use)
export type AgentCreatePayloadParsed = Static<typeof agentCreatePayloadParsedDto>;
export type AgentUpdatePayloadParsed = Static<typeof agentUpdatePayloadParsedDto>;
export type AgentDomainParsed = Static<typeof agentDomainParsedDto>;

// JSON alanları için tipler - DTO'lardan statik olarak türetilmiş
export type WhatsAppIntegrationConfig = Static<typeof whatsappIntegrationConfigSchema>;
export type ChatbotInstructions = Static<typeof chatbotInstructionsDto>;
export type ChatbotConfig = Static<typeof chatbotConfigDto>;
export type AgentDomainData = Static<typeof agentDomainDto>;


// Rag
export type AgentRagFileCreatePayload = Static<(typeof agentRagFileCreatePayloadDto)>;
export type AgentRagFileShowResponse = Static<(typeof agentRagFileResponseDto)>;
export type AgentRagFileIndexResponse = Static<(typeof agentRagFileIndexDto)['response']["200"]>;
export type AgentRagFileUpdatePayload = Static<(typeof agentRagFileUpdatePayloadDto)>;

