import { AgentCreateForm } from "#/components/form/agent-create-form";
import { Main } from "#/components/layout/main";
import { Button } from "#/components/ui/button";
import { useFormDialog } from "#/context/form-dialog-context";
import { DataTable } from "#components/datatable/data-table.tsx";
import { api } from "#lib/api.ts";
import { agentColumns } from "#lib/columns/agent.columns.tsx";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/(admin)/agents/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { openFormDialog, closeFormDialog } = useFormDialog();

  const handleCreateAgent = () => {
    openFormDialog({
      title: "Yeni Acente Ekle",
      content: <AgentCreateForm onSuccess={closeFormDialog} />,
      maxWidth: "sm:max-w-[425px]",
    });
  };

  const { data: agentResponse } = useQuery({
    queryKey: ["agents"],
    // @ts-ignore
    queryFn: () => api.agents.index.get({}),
  });

  return (
    <>
      <Main>
        <div className="container mx-auto">
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">Acenteler</h2>
                <p className="text-muted-foreground">
                  Tüm acenteleri yönetin ve yeni acente ekleyin.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button onClick={handleCreateAgent}>
                  <Plus className="mr-2 h-4 w-4" />
                  Acente Ekle
                </Button>
              </div>
            </div>

            {/* Data Table */}
            <div className="rounded-lg border bg-card">
              <DataTable
                columns={agentColumns}
                data={agentResponse?.data?.data ?? []}
              />
            </div>
          </div>
        </div>
      </Main>
    </>
  );
}
