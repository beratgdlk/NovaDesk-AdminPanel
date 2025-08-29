import { ConfirmDialog } from "#/components/confirm-dialog";
import { AgentUpdateForm } from "#/components/form/agent-update-form";
import { Button } from "#/components/ui/button";
import { useFormDialog } from "#/context/form-dialog-context";
import { useI18n } from "#/context/i18n-context";
import { api } from "#lib/api.ts";
import {
    IconEdit,
    IconExternalLink,
    IconTrash
} from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "#/components/ui/badge";
import { type AgentShowResponse } from "#backend/modules/agents/types";
import { formatDate } from "#lib/utils.ts";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";

const colHelper = createColumnHelper<AgentShowResponse>();

export const agentColumns = [
  colHelper.accessor("name", {
    header: () => {
      const { t } = useI18n();
      return t("agents.columns.name");
    },
    cell: ({ row }) => (
      <div className="font-medium text-foreground">{row.original.name}</div>
    ),
  }),

  colHelper.accessor("insurupAgentId", {
    header: () => {
      const { t } = useI18n();
      return t("agents.columns.insurupId");
    },
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground font-mono">
        {row.original.insurupAgentId ?? "-"}
      </div>
    ),
  }),

  colHelper.accessor("whatsappIntegrationConfig", {
    header: () => {
      const { t } = useI18n();
      return "WhatsApp";
    },
    cell: (info) => {
      const config = info.getValue() as any;
      const isEnabled = config?.isEnabled ?? false;

      return (
        <Badge variant={isEnabled ? "default" : "secondary"}>
          {isEnabled ? useI18n().t('common.active') : useI18n().t('common.inactive')}
        </Badge>
      );
    },
  }),

  colHelper.accessor("domains", {
    header: () => {
      const { t } = useI18n();
      return t("agents.columns.domains");
    },
    cell: ({ row }) => {
      const domains = row.original.domains;
      const activeDomains = domains?.filter((d) => d.isEnabled).length ?? 0;
      const totalDomains = domains?.length ?? 0;

      return (
        <div className="text-sm">
          <span className="font-medium">{activeDomains}</span>
          <span className="text-muted-foreground">/{totalDomains}</span>
        </div>
      );
    },
  }),

  colHelper.accessor("createdAt", {
    header: () => {
      const { t } = useI18n();
      return t("common.createdAt");
    },
    cell: ({ row }) => {
      return (
        <div className="text-sm text-muted-foreground">
          {formatDate(row.original.createdAt, "dd.MM.yyyy HH:mm")}
        </div>
      );
    },
  }),

  colHelper.accessor("updatedAt", {
    header: () => {
      const { t } = useI18n();
      return t("common.updatedAt");
    },
    cell: ({ row }) => {
      return (
        <div className="text-sm text-muted-foreground">
          {formatDate(row.original.updatedAt, "dd.MM.yyyy HH:mm")}
        </div>
      );
    },
  }),

  colHelper.display({
    id: "actions",
    header: () => {
      const { t } = useI18n();
      return t("common.actions");
    },
    cell: (info) => {
      const agent = info.row.original;
      return <AgentActions agent={agent} />;
    },
  }),
] as ColumnDef<AgentShowResponse>[];

interface AgentActionsProps {
  agent: AgentShowResponse;
}

function AgentActions({ agent }: AgentActionsProps) {
  const { openFormDialog, closeFormDialog } = useFormDialog();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const handleEdit = () => {
    openFormDialog({
      title: "Acente Düzenle",
      content: <AgentUpdateForm agent={agent} onSuccess={closeFormDialog} />,
      maxWidth: "sm:max-w-[425px]",
    });
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    const response = await api
      .agents({
        uuid: agent.uuid,
      })
      .delete();

    if (response.data) {
      toast.success("Acente başarıyla silindi");
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      setDeleteDialogOpen(false);
    } else {
      toast.error("Acente silinirken bir hata oluştu");
    }
    setIsDeleting(false);
  };

  return (
    <>
      <div className="flex items-center gap-1">
        {/* View Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          title="Görüntüle"
          asChild
        >
          <Link to="/$agentId" params={{ agentId: agent.uuid }}>
            <IconExternalLink className="h-4 w-4" />
          </Link>
        </Button>

        {/* Edit Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleEdit}
          title="Düzenle"
        >
          <IconEdit className="h-4 w-4" />
        </Button>

        {/* Delete Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleDeleteClick}
          title="Sil"
        >
          <IconTrash className="h-4 w-4" />
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Acenteyi Sil"
        desc={
          <div>
            <p className="mb-2">
              <strong>"{agent.name}"</strong> acentesini silmek istediğinizden
              emin misiniz?
            </p>
            <p className="text-sm text-muted-foreground">
              Bu işlem geri alınamaz ve acente ile ilgili tüm veriler
              silinecektir.
            </p>
          </div>
        }
        destructive
        confirmText={isDeleting ? "Siliniyor..." : "Sil"}
        cancelBtnText="İptal"
        handleConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </>
  );
}
