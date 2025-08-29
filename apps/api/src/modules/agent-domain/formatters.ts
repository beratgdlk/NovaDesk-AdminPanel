import type { AgentDomain } from '@onlyjs/db/client';
import { BaseFormatter } from '../../utils';
import { agentDomainResponseDto } from './dtos';
import type { AgentDomainResponse } from './types';

export abstract class AgentDomainFormatter {
  static response(data: AgentDomain & { 
    agent?: { 
      uuid: string; 
      name: string; 
      insurupAgentId: string; 
    } | null 
  }) {
    const convertedData = BaseFormatter.convertData<AgentDomainResponse>(
      {
        ...data,
        agent: data.agent || undefined,
      },
      agentDomainResponseDto,
    );
    return convertedData;
  }
}