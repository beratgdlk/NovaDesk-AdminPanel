import { t } from 'elysia';

// UIMessagePart schemas - AI SDK'daki gerçek tiplere uygun
const textUIPartSchema = t.Object({
  type: t.Literal('text'),
  text: t.String({ description: 'Metin içeriği' }),
  state: t.Optional(
    t.Union([t.Literal('streaming'), t.Literal('done')], { description: 'Text state' }),
  ),
  providerMetadata: t.Optional(t.Any({ description: 'Provider metadata' })),
});

const reasoningUIPartSchema = t.Object({
  type: t.Literal('reasoning'),
  text: t.String({ description: 'Reasoning text içeriği' }),
  state: t.Optional(
    t.Union([t.Literal('streaming'), t.Literal('done')], { description: 'Reasoning state' }),
  ),
  providerMetadata: t.Optional(t.Any({ description: 'Provider metadata' })),
});

const sourceUrlUIPartSchema = t.Object({
  type: t.Literal('source-url'),
  sourceId: t.String({ description: 'Source ID' }),
  url: t.String({ description: 'Source URL' }),
  title: t.Optional(t.String({ description: 'URL başlığı' })),
  providerMetadata: t.Optional(t.Any({ description: 'Provider metadata' })),
});

const sourceDocumentUIPartSchema = t.Object({
  type: t.Literal('source-document'),
  sourceId: t.String({ description: 'Source ID' }),
  mediaType: t.String({ description: 'Media type' }),
  title: t.String({ description: 'Dokuman başlığı' }),
  filename: t.Optional(t.String({ description: 'Dosya adı' })),
  providerMetadata: t.Optional(t.Any({ description: 'Provider metadata' })),
});

const fileUIPartSchema = t.Object({
  type: t.Literal('file'),
  mediaType: t.String({ description: 'MIME type' }),
  filename: t.Optional(t.String({ description: 'Dosya adı' })),
  url: t.String({ description: 'File URL' }),
  providerMetadata: t.Optional(t.Any({ description: 'Provider metadata' })),
});

const stepStartUIPartSchema = t.Object({
  type: t.Literal('step-start'),
});

// Tool ve Data parts için generic schema - karmaşık tipleri basitleştirmek için
const toolUIPartSchema = t.Object({
  type: t.String({ pattern: '^tool-', description: 'Tool type (tool-{name})' }),
  toolCallId: t.String({ description: 'Tool call ID' }),
  state: t.Optional(t.String({ description: 'Tool state' })),
  input: t.Optional(t.Any({ description: 'Tool input' })),
  output: t.Optional(t.Any({ description: 'Tool output' })),
  errorText: t.Optional(t.String({ description: 'Error text' })),
  providerExecuted: t.Optional(t.Boolean({ description: 'Provider executed' })),
  callProviderMetadata: t.Optional(t.Any({ description: 'Call provider metadata' })),
});

const dataUIPartSchema = t.Object({
  type: t.String({ pattern: '^data-', description: 'Data type (data-{name})' }),
  id: t.Optional(t.String({ description: 'Data ID' })),
  data: t.Any({ description: 'Data içeriği' }),
});

// UIMessagePart union schema
const uiMessagePartSchema = t.Union(
  [
    textUIPartSchema,
    reasoningUIPartSchema,
    sourceUrlUIPartSchema,
    sourceDocumentUIPartSchema,
    fileUIPartSchema,
    stepStartUIPartSchema,
    toolUIPartSchema,
    dataUIPartSchema,
  ],
  {
    description: 'UI Message part union',
  },
);

// UIMessage schema - AI SDK UIMessage tipine uygun
const uiMessageSchema = t.Object({
  id: t.String({
    description: 'Mesaj ID',
  }),
  role: t.Union([t.Literal('system'), t.Literal('user'), t.Literal('assistant')], {
    description: 'Mesajın gönderen tipi',
  }),
  parts: t.Array(uiMessagePartSchema, {
    description: 'Mesaj parts array',
  }),
  metadata: t.Optional(
    t.Any({
      description: 'Message metadata',
    }),
  ),
});

// Chat request schemas
export const chatMessageBodySchema = t.Object({
  message: t.Optional(
    t.String({
      minLength: 1,
      maxLength: 4000,
      description: 'Gönderilecek mesaj',
    }),
  ),
});

export const conversationHistoryQuerySchema = t.Object({
  limit: t.Optional(
    t.Number({
      minimum: 1,
      maximum: 100,
      default: 20,
      description: 'Getirilecek mesaj sayısı',
    }),
  ),
});

// Chat header schemas
export const chatHeadersSchema = t.Object({
  'x-conversation-id': t.Optional(
    t.String({
      description: "Konuşma ID'si",
    }),
  ),
  'x-selected-model': t.Optional(
    t.String({
      description: 'Seçilen model',
    }),
  ),
  Authorization: t.Optional(
    t.String({
      description: 'Bearer token for conversation session',
    }),
  ),
});

export const conversationHistoryHeadersSchema = t.Object({
  'x-conversation-id': t.String({
    description: "Geçmişi getirilecek conversation ID'si",
  }),
  Authorization: t.Optional(
    t.String({
      description: 'Bearer token for conversation session',
    }),
  ),
});

export const conversationListItemSchema = t.Object({
  conversationId: t.String({
    description: "Konuşma ID'si",
  }),
  title: t.String({
    description: 'Konuşma başlığı',
  }),
  lastMessage: t.String({
    description: 'Son mesaj',
  }),
  createdAt: t.String({
    description: 'Oluşturulma tarihi (ISO string)',
  }),
  updatedAt: t.String({
    description: 'Güncellenme tarihi (ISO string)',
  }),
});

// Chat response schemas
export const chatMessageResponseSchema = t.Object({
  conversationId: t.String({
    description: "Konuşma ID'si",
  }),
  messages: t.Array(uiMessageSchema, {
    description: 'Konuşma mesajları (UIMessage formatında)',
  }),
  newSessionId: t.Optional(
    t.String({
      description: 'Yeni session ID (session recovery durumunda)',
    }),
  ),
  sessionUpdated: t.Optional(
    t.Boolean({
      description: 'Session güncellendi mi',
    }),
  ),
});

export const conversationHistoryResponseSchema = t.Object({
  conversationId: t.String({
    description: "Konuşma ID'si",
  }),
  messages: t.Array(uiMessageSchema, {
    description: 'Konuşma mesajları (UIMessage formatında)',
  }),
  totalMessages: t.Number({
    description: 'Toplam mesaj sayısı',
  }),
  hasMore: t.Boolean({
    description: 'Daha fazla mesaj var mı',
  }),
});

export const conversationListResponseSchema = t.Object({
  conversations: t.Array(conversationListItemSchema, {
    description: 'Konuşma listesi',
  }),
  total: t.Number({
    description: 'Toplam konuşma sayısı',
  }),
});
