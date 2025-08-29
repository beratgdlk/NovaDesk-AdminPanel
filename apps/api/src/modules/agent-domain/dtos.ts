import { AgentDomainPlain } from '@onlyjs/db/prismabox/AgentDomain';
import { t } from 'elysia';
import { type ControllerHook, errorResponseDto, uuidValidation } from '../../utils';
import { paginationQueryDto, paginationResponseDto } from '../../utils/pagination';

// AgentDomain response DTO
export const agentDomainResponseDto = t.Composite([
  AgentDomainPlain,
  t.Object({
    agent: t.Optional(t.Object({
      uuid: t.String(),
      name: t.String(),
      insurupAgentId: t.String(),
    })),
  }),
]);

// INDEX DTO for listing agent domains
export const agentDomainIndexDto = {
  query: t.Object({
    ...paginationQueryDto.properties,
    search: t.Optional(t.String()),
    agentUuid: t.Optional(t.String()),
    isEnabled: t.Optional(t.Boolean()),
  }),
  response: {
    200: paginationResponseDto(agentDomainResponseDto),
  },
  detail: {
    summary: 'Index',
    description: 'Acente domainlerinin listesini döndürür',
  },
} satisfies ControllerHook;

// DESTROY DTO for deleting agent domain
export const agentDomainDestroyDto = {
  params: t.Object({
    uuid: uuidValidation,
  }),
  response: { 
    200: t.Object({ message: t.String() }), 
    404: errorResponseDto[404] 
  },
  detail: {
    summary: 'Destroy',
    description: 'Acente domainini siler',
  },
} satisfies ControllerHook;