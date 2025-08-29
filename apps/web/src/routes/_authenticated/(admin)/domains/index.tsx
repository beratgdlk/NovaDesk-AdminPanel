import { Main } from "#/components/layout/main";
import { DataTable } from "#components/datatable/data-table.tsx";
import { api } from "#lib/api.ts";
import { domainColumns } from "#lib/columns/domain.columns.tsx";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute('/_authenticated/(admin)/domains/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { data: domainResponse } = useQuery({
    queryKey: ["agent-domains"],
    // @ts-ignore
    queryFn: () => api["agent-domains"].index.get({}),
  });

  return (
    <>
      <Main>
        <div className="container mx-auto">
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">Domainler</h2>
                <p className="text-muted-foreground">
                  Tüm acente domainlerini görüntüleyin ve yönetin.
                </p>
              </div>
            </div>

            {/* Data Table */}
            <div className="rounded-lg border bg-card">
              <DataTable
                columns={domainColumns}
                data={domainResponse?.data?.data ?? []}
              />
            </div>
          </div>
        </div>
      </Main>
    </>
  );
}
