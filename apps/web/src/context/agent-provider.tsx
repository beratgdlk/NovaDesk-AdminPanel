import { api } from "#lib/api.ts";
import useAgentStore from "#stores/agent-store.ts";
import { useQuery } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { useEffect } from "react";

export function AgentProvider({
  children,
  agentId,
}: {
  children: React.ReactNode;
  agentId: string;
}) {
  const { setAgent } = useAgentStore();
  const { data: response, isLoading } = useQuery({
    queryKey: ["agent"],
    queryFn: () => api.agents({ uuid: agentId }).get(),
  });

  useEffect(() => {
    if (response?.data && !isLoading) {
      setAgent(response.data);
    }
    if (!response?.data && !isLoading) {
      throw notFound();
    }
  }, [response, isLoading]);

  return <>{children}</>;
}
