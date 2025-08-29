import { AdminLayout } from "#components/layout/admin-layout.tsx";
import { useSession } from "#context/session-provider.tsx";
import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/(admin)")({
  component: RouteComponent,
});

function RouteComponent() {
  const user = useSession();
  if (user.agentUuid) {
    return <Navigate to="/$agentId" params={{ agentId: user.agentUuid }} />;
  }
  return <AdminLayout />;
}
