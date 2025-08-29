import { SessionProvider } from "#context/session-provider.tsx";
import { api } from "#lib/api.ts";
import {
  createFileRoute,
  Outlet,
  redirect
} from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  loader: async ({ context }) => {
    const { queryClient } = context;
    const session = await queryClient.ensureQueryData({
      queryKey: ["session"],
      queryFn: () => api.auth.me.get(),
    });
    if (!session.data) {
      throw redirect({ to: "/sign-in" });
    }
    return { session: session.data };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { session } = Route.useLoaderData();
  return (
    <SessionProvider user={session}>
      <Outlet />
    </SessionProvider>
  );
}
