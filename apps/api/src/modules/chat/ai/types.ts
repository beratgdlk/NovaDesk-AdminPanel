// LangGraph chunk format için shared types
export interface ToolCallData {
  id: string;
  name?: string;
  args?: Record<string, unknown> | string;
  arguments?: Record<string, unknown> | string;
  function?: {
    name: string;
    arguments?: string;
  };
  type?: string;
}
