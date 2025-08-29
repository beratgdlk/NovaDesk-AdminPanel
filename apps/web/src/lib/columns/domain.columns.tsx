import { ConfirmDialog } from "#/components/confirm-dialog";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { api } from "#lib/api.ts";
import { formatDate } from "#lib/utils.ts";
import { IconTrash } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { useState } from "react";
import { toast } from "sonner";

// Define the domain response type based on the API structure
interface DomainResponse {
  uuid: string;
  domain: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  agent: {
    uuid: string;
    name: string;
    insurupAgentId: string;
  };
}

const colHelper = createColumnHelper<DomainResponse>();

export const domainColumns = [
  colHelper.accessor("domain", {
    header: "Domain",
    cell: ({ row }) => (
      <div className="font-medium text-foreground">{row.original.domain}</div>
    ),
  }),

  colHelper.accessor("agent.name", {
    header: "Acente",
    cell: ({ row }) => (
      <div className="text-sm">{row.original.agent?.name || "-"}</div>
    ),
  }),

  colHelper.accessor("isEnabled", {
    header: "Durum",
    cell: ({ getValue }) => {
      const isEnabled = getValue();
      return (
        <Badge variant={isEnabled ? "default" : "secondary"}>
          {isEnabled ? "Aktif" : "Pasif"}
        </Badge>
      );
    },
  }),

  colHelper.accessor("createdAt", {
    header: "Oluşturulma Tarihi",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {formatDate(row.original.createdAt, "dd.MM.yyyy HH:mm")}
      </div>
    ),
  }),

  colHelper.accessor("updatedAt", {
    header: "Güncellenme Tarihi",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {formatDate(row.original.updatedAt, "dd.MM.yyyy HH:mm")}
      </div>
    ),
  }),

  colHelper.display({
    id: "actions",
    header: "İşlemler",
    cell: (info) => {
      const domain = info.row.original;
      return <DomainActions domain={domain} />;
    },
  }),
] as ColumnDef<DomainResponse>[];

interface DomainActionsProps {
  domain: DomainResponse;
}

function DomainActions({ domain }: DomainActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const response = await api["agent-domains"][domain.uuid].delete();

      if (response.data) {
        toast.success("Domain başarıyla silindi");
        queryClient.invalidateQueries({ queryKey: ["agent-domains"] });
        setDeleteDialogOpen(false);
      } else {
        toast.error("Domain silinirken bir hata oluştu");
      }
    } catch (error) {
      toast.error("Domain silinirken bir hata oluştu");
    }
    setIsDeleting(false);
  };

  return (
    <>
      <div className="flex items-center gap-1">
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
        title="Domaini Sil"
        desc={
          <div>
            <p className="mb-2">
              <strong>"{domain.domain}"</strong> domainini silmek istediğinizden
              emin misiniz?
            </p>
            <p className="text-sm text-muted-foreground">
              Bu işlem geri alınamaz.
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