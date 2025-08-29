import { errorResponseDto } from '#utils/common-dtos';
import { type ControllerHook } from '#utils/elysia-types';
import {
  chatMessageBodySchema,
  chatHeadersSchema,
  chatMessageResponseSchema,
  conversationHistoryQuerySchema,
  conversationHistoryHeadersSchema,
  conversationHistoryResponseSchema,
  conversationListResponseSchema,
} from './schemas';

// ============================================================================
// Chat DTOs
// ============================================================================

export const chatMessageDto = {
  body: chatMessageBodySchema,
  headers: chatHeadersSchema,
  response: {
    200: chatMessageResponseSchema,
    400: errorResponseDto[400],
    403: errorResponseDto[403],
    500: errorResponseDto[500],
  },
  detail: {
    summary: 'Chat mesajı gönder',
    description:
      "Kullanıcıdan gelen mesajı MCP agent'a yönlendirir ve yanıtı döner. Anonim session otomatik oluşturulur.",
    tags: ['Chat'],
  },
} satisfies ControllerHook;

export const conversationHistoryDto = {
  query: conversationHistoryQuerySchema,
  headers: conversationHistoryHeadersSchema,
  response: {
    200: conversationHistoryResponseSchema,
    400: errorResponseDto[400],
    403: errorResponseDto[403],
    404: errorResponseDto[404],
    500: errorResponseDto[500],
  },
  detail: {
    summary: 'Konuşma geçmişini getir',
    description:
      "Belirtilen conversation ID'ye ait mesaj geçmişini döner. Sadece aynı session'a ait conversation'lara erişilebilir.",
    tags: ['Chat'],
  },
} satisfies ControllerHook;

export const conversationListDto = {
  response: {
    200: conversationListResponseSchema,
    400: errorResponseDto[400],
    500: errorResponseDto[500],
  },
  detail: {
    summary: 'Konuşma listesini getir',
    description: "Kullanıcının session'ına ait tüm konuşmaları listeler.",
    tags: ['Chat'],
  },
} satisfies ControllerHook;
