export type AgentRagFileCreatePayload = {
  file: File | null;
  name: string;
};

export type AgentRagFileUpdatePayload = {
  name?: string;
  isActive?: boolean;
};

export type AgentRagFileShowResponse = {
  uuid: string;
  name: string;
  title?: string;
  path: string;
  isActive: boolean;
};

