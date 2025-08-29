import { RoleCreateForm } from "#/components/form/role-create-form";
import { Main } from "#/components/layout/main";
import { Button } from "#/components/ui/button";
import { useFormDialog } from "#/context/form-dialog-context";
import { DataTable } from "#components/datatable/data-table.tsx";
import { api } from "#lib/api.ts";
import { roleColumns } from "#lib/columns/role.columns.tsx";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/(admin)/roles/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { openFormDialog, closeFormDialog } = useFormDialog();

  const handleCreateRole = () => {
    openFormDialog({
      title: "Yeni Rol Ekle",
      content: <RoleCreateForm onSuccess={closeFormDialog} />,
      maxWidth: "sm:max-w-[600px]",
    });
  };

  const { data: roleResponse } = useQuery({
    queryKey: ["roles"],
    // @ts-ignore
    queryFn: () => api.roles.get({}),
  });

  return (
    <>
      <Main>
        <div className="container mx-auto">
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">Roller</h2>
                <p className="text-muted-foreground">
                  Tüm rolleri yönetin ve yeni rol ekleyin.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button onClick={handleCreateRole}>
                  <Plus className="mr-2 h-4 w-4" />
                  Rol Ekle
                </Button>
              </div>
            </div>

            {/* Data Table */}
            <div className="rounded-lg border bg-card">
              <DataTable
                columns={roleColumns}
                data={roleResponse?.data ?? []}
              />
            </div>
          </div>
        </div>
      </Main>
    </>
  );
}
