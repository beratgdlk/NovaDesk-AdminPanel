import { Elysia } from "elysia";
import { dtoWithMiddlewares, NotFoundException } from "../../utils";
import { PaginationService } from "../../utils/pagination";
import { AuditLogAction, AuditLogEntity, withAuditLog } from "../audit-logs";
import { auth } from "../auth/authentication/plugin";
import { PERMISSIONS } from "../auth/roles/constants";
import { withPermission } from "../auth/roles/middleware";
import {
  agentConfigDto,
  agentCreateDto,
  agentDestroyDto,
  agentIndexDto,
  agentRagFileCreateDto,
  agentRagFileDestroyDto,
  agentRagFileIndexDto,
  agentRagFileUpdateDto,
  agentShowDto,
  agentUpdateDto,
} from "./dtos";
import { AgentFormatter } from "./formatters";
import { AgentsService } from "./service";
import type { ChatbotConfig } from "./types";

const app = new Elysia({ prefix: "/agents", tags: ["Agent"] })
  .get(
    "/",
    async ({ query }) => {
      const { data, total } = await AgentsService.index(query);
      return PaginationService.createPaginatedResponse({
        data,
        total,
        query,
        formatter: AgentFormatter.response,
      });
    },
    agentIndexDto
  )
  .get(
    "/:uuid",
    async ({ params }) => {
      const agent = await AgentsService.show(params.uuid);
      if (!agent) throw new NotFoundException("Acente bulunamadı");
      return AgentFormatter.response(agent);
    },
    agentShowDto
  )
  .get(
    "/config",
    async ({ request }) => {
      const agent = await AgentsService.showByDomain(request);
      if (!agent) throw new NotFoundException("Acente bulunamadı");
      return AgentFormatter.configResponse(
        agent.chatbotConfig as ChatbotConfig
      );
    },
    agentConfigDto
  )
  .use(auth())
  .post(
    "/",
    async ({ body }) => {
      const agent = await AgentsService.store(body);
      return AgentFormatter.response(agent);
    },
    dtoWithMiddlewares(
      agentCreateDto,
      withPermission(PERMISSIONS.AGENTS.CREATE),
      withAuditLog({
        actionType: AuditLogAction.CREATE,
        entityType: AuditLogEntity.AGENT,
        getEntityUuid: (ctx) => {
          const response = ctx.response as ReturnType<
            typeof AgentFormatter.response
          >;
          return response.uuid;
        },
        getDescription: () => "Yeni acente oluşturuldu",
      })
    )
  )
  .put(
    "/:uuid",
    async ({ params, body }) => {
      const agent = await AgentsService.update(params.uuid, body);
      if (!agent) throw new NotFoundException("Acente bulunamadı");
      return AgentFormatter.response(agent);
    },
    dtoWithMiddlewares(
      agentUpdateDto,
      withPermission(PERMISSIONS.AGENTS.UPDATE),
      withAuditLog({
        actionType: AuditLogAction.UPDATE,
        entityType: AuditLogEntity.AGENT,
        getEntityUuid: ({ params }) => params.uuid!,
        getDescription: ({ body }) =>
          `Acente güncellendi: ${Object.keys(body as object).join(", ")}`,
        getMetadata: ({ body }) => ({ updatedFields: body }),
      })
    )
  )
  .delete(
    "/:uuid",
    async ({ params }) => {
      const agent = await AgentsService.destroy(params.uuid);
      if (!agent) throw new NotFoundException("Acente bulunamadı");
      return { message: "Acente başarıyla silindi" };
    },
    dtoWithMiddlewares(
      agentDestroyDto,
      withPermission(PERMISSIONS.AGENTS.DESTROY),
      withAuditLog({
        actionType: AuditLogAction.DELETE,
        entityType: AuditLogEntity.AGENT,
        getEntityUuid: ({ params }) => params.id!,
        getDescription: () => "Acente silindi",
      })
    )
  )
  .get(
    "/:uuid/documents",
    async ({ params }) => {
      const documents = await AgentsService.indexRagFile(params.uuid);
      return documents.map(AgentFormatter.ragFileResponse);
    },
    agentRagFileIndexDto
  )
  .delete(
    "/:uuid/documents/:documentUuid",
    async ({ params }) => {
      const document = await AgentsService.destroyRagFile(params.uuid, params.documentUuid);
      return AgentFormatter.ragFileResponse(document);
    },
    agentRagFileDestroyDto
  )
  .patch(
    "/:uuid/documents/:documentUuid",
    async ({ params, body }) => {
      const document = await AgentsService.updateRagFile(params.uuid, params.documentUuid, body);

      return AgentFormatter.ragFileResponse(document);
    },
    agentRagFileUpdateDto

  )
  .post(
    "/:uuid/documents",
    async ({ params, body }) => {
      const document = await AgentsService.storeRagFile(params.uuid, body);

      return AgentFormatter.ragFileResponse(document);
    },
    agentRagFileCreateDto
  );

export default app;
