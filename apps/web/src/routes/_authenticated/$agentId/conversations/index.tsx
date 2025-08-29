import { Main } from "#/components/layout/main";
import { type ConversationList } from "#backend/modules/chat/types";
import { DataTable } from "#components/datatable/data-table.tsx";
import { api } from "#lib/api.ts";
import { conversationColumns } from "#lib/columns/conversation.columns.tsx";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/$agentId/conversations/")(
  {
    component: RouteComponent,
  }
);

function RouteComponent() {
  const { agentId } = Route.useParams();

  // Mock data for now - replace with actual API call
  const { data: conversationsResponse } = useQuery({
    queryKey: ["conversations", agentId],
    // @ts-ignore
    queryFn: () => api.chat.conversations.get({}),
  });

  const conversationList: ConversationList = conversationsResponse?.data ?? {
    conversations: [],
    total: 0,
  };

  return (
    <Main>
      <div className="container mx-auto">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">Konuşmalar</h2>
              <p className="text-muted-foreground">
                Acente konuşmalarını görüntüleyin ve yönetin.
              </p>
            </div>
          </div>

          {/* Data Table */}
          <div className="rounded-lg border bg-card">
            <DataTable
              columns={conversationColumns}
              data={conversationList.conversations}
            />
          </div>
        </div>
      </div>
    </Main>
  );
}
