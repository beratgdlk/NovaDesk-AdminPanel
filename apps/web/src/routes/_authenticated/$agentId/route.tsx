import { AgentLayout } from "#components/layout/agent-layout.tsx";
import { AgentProvider } from "#context/agent-provider.tsx";
import { useSession } from "#context/session-provider.tsx";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/$agentId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { agentId } = Route.useParams();
  const user = useSession();
  if (user.agentUuid && user.agentUuid !== agentId) {
    throw redirect({ to: "/$agentId", params: { agentId: user.agentUuid } });
  }
  return (
    <AgentProvider agentId={agentId}>
      <AgentLayout>
        <Outlet />
      </AgentLayout>
    </AgentProvider>
  );
}
