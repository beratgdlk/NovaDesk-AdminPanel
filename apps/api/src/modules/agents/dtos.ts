import { AgentPlain } from "@onlyjs/db/prismabox/Agent";
import { t } from "elysia";

import { errorResponseDto } from "../../utils/common-dtos";
import { uuidValidation } from "../../utils/common-field-validations";
import { type ControllerHook } from "../../utils/elysia-types";
import {
  paginationQueryDto,
  paginationResponseDto,
} from "../../utils/pagination";
import { fileLibraryAssetCreateInputDto, fileLibraryAssetResponseDto } from "../file-library-assets";
import { WidgetPosition } from "./types";

// JSON alanları için DTO'lar
export const whatsappIntegrationConfigSchema = t.Object({
  phoneNumberId: t.Optional(t.String()), // WhatsApp'a mesaj göndereceğiniz numarayı belirtmek için
  accessToken: t.Optional(t.String()), // Meta Graph API'ye erişmek için gerekli kimlik doğrulama bilgisi
  businessAccountId: t.Optional(t.String()), // Meta tarafından işletme doğrulaması için gerekir
  appId: t.Optional(t.String()), // Meta uygulamasıyla ilişkilendirmek için
  webhookVerifyToken: t.Optional(t.String()), // Webhook doğrulama sırasında kullanılır
  isEnabled: t.Boolean(),
});

export const chatbotInstructionsDto = t.Object({
  voiceTone: t.Optional(t.String()),
  welcomeMessage: t.Optional(t.String()),
  aboutUs: t.Optional(t.String()),
});

export const chatbotConfigDto = t.Object({
  chatbotName: t.Optional(t.String()),
  chatbotImage: t.Optional(t.String()), // File path after upload
  widgetPosition: t.Optional(
    t.Union([
      t.Literal(WidgetPosition.LEFT),
      t.Literal(WidgetPosition.LEFT_CENTER),
      t.Literal(WidgetPosition.RIGHT_CENTER),
      t.Literal(WidgetPosition.RIGHT),
    ])
  ),
  primaryColor: t.Optional(t.String()),
  secondaryColor: t.Optional(t.String()),
  backgroundColor: t.Optional(t.String()),
  textColor: t.Optional(t.String()),
  borderRadius: t.Optional(t.Number()),
});

export const agentDomainDto = t.Object({
  uuid: t.String(),
  domain: t.String(),
  isEnabled: t.Boolean(),
});

// Parsed versions without transforms (for internal use)
export const agentDomainParsedDto = t.Object({
  domain: t.String(),
  isEnabled: t.Boolean(),
});

export const agentCreatePayloadParsedDto = t.Object({
  name: t.String(),
  insurupAgentId: t.String(),
  whatsappIntegrationConfig: whatsappIntegrationConfigSchema,
  chatbotInstructions: chatbotInstructionsDto,
  chatbotConfig: chatbotConfigDto,
  chatbotImageFile: t.Optional(t.File()),
  domains: t.Optional(t.Array(agentDomainParsedDto)),
});




export const agentRagFileResponseDto = fileLibraryAssetResponseDto
export const agentRagFileCreatePayloadDto = t.Composite([
  t.Omit(fileLibraryAssetCreateInputDto, ["type", "metadata"]),
  t.Object({
    name: t.String(),
  })
])
export const agentRagFileUpdatePayloadDto = t.Partial(t.Composite([
  t.Object({
    isActive: t.Boolean(),
    name: t.String()
  })
]))


export const agentRagFileCreateDto = {
  body: agentRagFileCreatePayloadDto,
  response: {
    200: agentRagFileResponseDto,
    404: errorResponseDto[404],
    422: errorResponseDto[422],
  },
  detail: {
    summary: "Add RAG Document",
    description: "Acente için yeni bir RAG belgesi ekler",
  }
} satisfies ControllerHook;

export const agentRagFileUpdateDto = {
  params: t.Object({
    uuid: uuidValidation,
    documentUuid: uuidValidation,
  }),
  body: agentRagFileUpdatePayloadDto,
  response: {
    200: agentRagFileResponseDto,
    404: errorResponseDto[404],
    422: errorResponseDto[422],
  },
  detail: {
    summary: "Update RAG Document",
    description: "Acente için yüklenmiş RAG belgesini günceller",
  }
} satisfies ControllerHook;
export const agentRagFileDestroyDto = {
  params: t.Object({
    uuid: uuidValidation,
    documentUuid: uuidValidation,
  }),
  response: {
    200: agentRagFileResponseDto,
    404: errorResponseDto[404],
    422: errorResponseDto[422],
  },
  detail: {
    summary: "Destroy RAG Document",
    description: "Acente için yüklenmiş RAG belgesini siler",
  }
} satisfies ControllerHook;

export const agentRagFileIndexDto = {
  params: t.Object({
    uuid: uuidValidation,
  }),
  response: {
    200: t.Array(agentRagFileResponseDto),
    404: errorResponseDto[404],
    422: errorResponseDto[422],
  },
  detail: {
    summary: "Index RAG Documents",
    description: "Acente için yüklenmiş RAG belgelerini döndürür",
  }
} satisfies ControllerHook;



export const agentUpdatePayloadParsedDto = t.Object({
  name: t.Optional(t.String()),
  insurupAgentId: t.Optional(t.String()),
  whatsappIntegrationConfig: t.Optional(whatsappIntegrationConfigSchema),
  chatbotInstructions: t.Optional(chatbotInstructionsDto),
  chatbotConfig: t.Optional(chatbotConfigDto),
  chatbotImageFile: t.Optional(t.File()),
  domains: t.Optional(t.Array(agentDomainParsedDto)),
});

// Agent response DTO with typed JSON fields and domains
export const agentResponseDto = t.Composite([
  AgentPlain,
  t.Object({
    whatsappIntegrationConfig: whatsappIntegrationConfigSchema,
    chatbotInstructions: chatbotInstructionsDto,
    chatbotConfig: chatbotConfigDto,
    domains: t.Array(agentDomainDto),
  }),
]);

// Create DTO with typed JSON fields
export const agentCreatePayloadDto = t.Object({
  name: t.String(),
  insurupAgentId: t.String(),
  whatsappIntegrationConfig: t
    .Transform(
      t.Union([
        t.String(),
        whatsappIntegrationConfigSchema,
      ])
    )
    .Decode((value) => {
      if (typeof value === "string") {
        try {
          return JSON.parse(value);
        } catch {
          throw new Error("Invalid JSON format for whatsappIntegrationConfig");
        }
      }
      return value;
    })
    .Encode((value) => value),
  chatbotInstructions: t
    .Transform(
      t.Union([
        t.String(),
        chatbotInstructionsDto,
      ])
    )
    .Decode((value) => {
      if (typeof value === "string") {
        try {
          return JSON.parse(value);
        } catch {
          throw new Error("Invalid JSON format for chatbotInstructions");
        }
      }
      return value;
    })
    .Encode((value) => value),
  chatbotConfig: t
    .Transform(
      t.Union([
        t.String(),
        chatbotConfigDto,
      ])
    )
    .Decode((value) => {
      if (typeof value === "string") {
        try {
          return JSON.parse(value);
        } catch {
          throw new Error("Invalid JSON format for chatbotConfig");
        }
      }
      return value;
    })
    .Encode((value) => value),
  chatbotImageFile: t.Optional(t.File()), // File for chatbot image upload
  domains: t.Optional(
    t
      .Transform(
        t.Union([
          t.String(),
          t.Array(t.String()),
          t.Object({
            domain: t.String(),
            isEnabled: t.Boolean(),
          }),
          t.Array(
            t.Object({
              domain: t.String(),
              isEnabled: t.Boolean(),
            })
          ),
        ])
      )
      .Decode((value) => {
        // Eğer zaten object array ise direkt döndür
        if (
          Array.isArray(value) &&
          value.length > 0 &&
          typeof value[0] === "object" &&
          value[0] !== null
        ) {
          return value;
        }

        // Eğer tek object ise array'e çevir
        if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          return [value];
        }

        // String veya string array ise JSON parse et
        const normalizedArray = Array.isArray(value) ? value : [value];
        return normalizedArray.map((item) => {
          if (typeof item === "string") {
            try {
              return JSON.parse(item);
            } catch {
              throw new Error("Invalid JSON format for domains");
            }
          }
          return item;
        });
      })
      .Encode((value) => value)
  ),
});

// Update DTO with typed JSON fields
export const agentUpdatePayloadDto = t.Object({
  name: t.Optional(t.String()),
  insurupAgentId: t.Optional(t.String()),
  whatsappIntegrationConfig: t.Optional(
    t
      .Transform(
        t.Union([
          t.String(),
          whatsappIntegrationConfigSchema,
        ])
      )
      .Decode((value) => {
        if (typeof value === "string") {
          try {
            return JSON.parse(value);
          } catch {
            throw new Error("Invalid JSON format for whatsappIntegrationConfig");
          }
        }
        return value;
      })
      .Encode((value) => value)
  ),
  chatbotInstructions: t.Optional(
    t
      .Transform(
        t.Union([
          t.String(),
          chatbotInstructionsDto,
        ])
      )
      .Decode((value) => {
        if (typeof value === "string") {
          try {
            return JSON.parse(value);
          } catch {
            throw new Error("Invalid JSON format for chatbotInstructions");
          }
        }
        return value;
      })
      .Encode((value) => value)
  ),
  chatbotConfig: t.Optional(
    t
      .Transform(
        t.Union([
          t.String(),
          chatbotConfigDto,
        ])
      )
      .Decode((value) => {
        if (typeof value === "string") {
          try {
            return JSON.parse(value);
          } catch {
            throw new Error("Invalid JSON format for chatbotConfig");
          }
        }
        return value;
      })
      .Encode((value) => value)
  ),
  chatbotImageFile: t.Optional(t.File()), // File for chatbot image upload
  domains: t.Optional(
    t
      .Transform(
        t.Union([
          t.String(),
          t.Array(t.String()),
          t.Object({
            domain: t.String(),
            isEnabled: t.Boolean(),
          }),
          t.Array(
            t.Object({
              domain: t.String(),
              isEnabled: t.Boolean(),
            })
          ),
        ])
      )
      .Decode((value) => {
        // Eğer zaten object array ise direkt döndür
        if (
          Array.isArray(value) &&
          value.length > 0 &&
          typeof value[0] === "object" &&
          value[0] !== null
        ) {
          return value;
        }

        // Eğer tek object ise array'e çevir
        if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          return [value];
        }

        // String veya string array ise JSON parse et
        const normalizedArray = Array.isArray(value) ? value : [value];
        return normalizedArray.map((item) => {
          if (typeof item === "string") {
            try {
              return JSON.parse(item);
            } catch {
              throw new Error("Invalid JSON format for domains");
            }
          }
          return item;
        });
      })
      .Encode((value) => value)
  ),
});

export const agentIndexDto = {
  query: t.Object({
    ...paginationQueryDto.properties,
    search: t.Optional(t.String()),
  }),
  response: {
    200: paginationResponseDto(agentResponseDto),
  },
  detail: {
    summary: "Index",
    description: "Acentelerin listesini döndürür",
  },
} satisfies ControllerHook;

export const agentCreateDto = {
  body: agentCreatePayloadDto,
  response: { 200: agentResponseDto, 422: errorResponseDto[422] },
  detail: {
    summary: "Create",
    description: "Yeni acente oluşturur",
  },
} satisfies ControllerHook;

export const agentUpdateDto = {
  params: t.Object({
    uuid: uuidValidation,
  }),
  body: agentUpdatePayloadDto,
  response: {
    200: agentResponseDto,
    404: errorResponseDto[404],
    422: errorResponseDto[422],
  },
  detail: {
    summary: "Update",
    description: "Acenteyi günceller",
  },
} satisfies ControllerHook;

export const agentShowDto = {
  params: t.Object({
    uuid: uuidValidation,
  }),
  response: { 200: agentResponseDto, 404: errorResponseDto[404] },
  detail: {
    summary: "Show",
    description: "Acente detaylarını döndürür",
  },
} satisfies ControllerHook;

export const agentConfigDto = {
  response: { 200: chatbotConfigDto, 404: errorResponseDto[404] },
  detail: {
    summary: "Chatbot Config",
    description: "Acente chatbot yapılandırmasını döndürür",
  },
} satisfies ControllerHook;

export const agentDestroyDto = {
  ...agentShowDto,
  response: {
    200: t.Object({ message: t.String() }),
    404: errorResponseDto[404],
  },
  detail: {
    summary: "Destroy",
    description: "Acenteyi siler",
  },
} satisfies ControllerHook;
