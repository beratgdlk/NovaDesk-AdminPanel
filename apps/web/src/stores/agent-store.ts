import { create } from 'zustand';
import { type AgentShowResponse } from '#backend/modules/agents/types';

const useAgentStore = create<AgentStore>((set) => ({
  agent: null,
  setAgent: (agent) => set({ agent }),
}));

interface AgentStore {
  agent: AgentShowResponse | null;
  setAgent: (agent: AgentShowResponse | null) => void;
}

export default useAgentStore;
