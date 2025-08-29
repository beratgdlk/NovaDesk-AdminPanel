import type { Static } from 'elysia';
import {
    agentDomainDestroyDto,
    agentDomainIndexDto,
    agentDomainResponseDto,
} from './dtos';

// Main response type for AgentDomain
export type AgentDomainResponse = Static<typeof agentDomainResponseDto>;

// INDEX operation types
export type AgentDomainIndexQuery = Static<(typeof agentDomainIndexDto)['query']>;

// DESTROY operation types  
export type AgentDomainDestroyParams = Static<(typeof agentDomainDestroyDto)['params']>;