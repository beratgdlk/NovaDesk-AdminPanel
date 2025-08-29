import { UserCreateForm } from "#/components/form/user-create-form";
import { Main } from "#/components/layout/main";
import { Button } from "#/components/ui/button";
import { useFormDialog } from "#/context/form-dialog-context";
import { useI18n } from "#/context/i18n-context";
import { DataTable } from "#components/datatable/data-table.tsx";
import { api } from "#lib/api.ts";
import { userColumns } from "#lib/columns/user.columns.tsx";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/(admin)/users/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { openFormDialog, closeFormDialog } = useFormDialog();
  const { t } = useI18n();

  const handleCreateUser = () => {
    openFormDialog({
      title: t("users.create.title"),
      content: <UserCreateForm onSuccess={closeFormDialog} />,
      maxWidth: "sm:max-w-[700px]",
    });
  };

  const { data: userResponse } = useQuery({
    queryKey: ["users"],
    // @ts-ignore
    queryFn: () => api.users.get({}),
  });

  return (
    <>
      <Main>
        <div className="container mx-auto">
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">{t('users.title')}</h2>
                <p className="text-muted-foreground">{t('users.subtitle')}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button onClick={handleCreateUser}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('users.create.button')}
                </Button>
              </div>
            </div>

            {/* Data Table */}
            <div className="rounded-lg border bg-card">
              <DataTable
                columns={userColumns}
                data={userResponse?.data ?? []}
              />
            </div>
          </div>
        </div>
      </Main>
    </>
  );
}
