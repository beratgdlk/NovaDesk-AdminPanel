import { Elysia } from "elysia";
import { dtoWithMiddlewares, NotFoundException } from "../../utils";
import { PaginationService } from "../../utils/pagination";
import { AuditLogAction, AuditLogEntity, withAuditLog } from "../audit-logs";
import { auth } from "../auth/authentication/plugin";
import { PERMISSIONS } from "../auth/roles/constants";
import { withPermission } from "../auth/roles/middleware";
import { agentDomainDestroyDto, agentDomainIndexDto } from "./dtos";
import { AgentDomainFormatter } from "./formatters";
import { AgentDomainService } from "./service";

const app = new Elysia({ prefix: "/agent-domains", tags: ["Agent Domain"] })
  .use(auth())
  .get(
    "/",
    async ({ query }) => {
      const { data, total } = await AgentDomainService.index(query);
      return PaginationService.createPaginatedResponse({
        data,
        total,
        query,
        formatter: AgentDomainFormatter.response,
      });
    },
    dtoWithMiddlewares(
      agentDomainIndexDto,
      withPermission(PERMISSIONS.AGENT_DOMAINS.SHOW)
    )
  )
  .delete(
    "/:uuid",
    async ({ params }) => {
      const agentDomain = await AgentDomainService.destroy(params.uuid);
      if (!agentDomain)
        throw new NotFoundException("Acente domaini bulunamadı");
      return { message: "Acente domaini başarıyla silindi" };
    },
    dtoWithMiddlewares(
      agentDomainDestroyDto,
      withPermission(PERMISSIONS.AGENT_DOMAINS.DESTROY),
      withAuditLog({
        actionType: AuditLogAction.DELETE,
        entityType: AuditLogEntity.AGENT_DOMAIN,
        getEntityUuid: ({ params }) => params.uuid!,
        getDescription: () => "Acente domaini silindi",
      })
    )
  );

export default app;
