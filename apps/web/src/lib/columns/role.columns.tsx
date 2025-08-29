import { ConfirmDialog } from "#/components/confirm-dialog";
import { RoleShowModal } from "#/components/dialog/role-show-modal";
import { RoleUpdateForm } from "#/components/form/role-update-form";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { useFormDialog } from "#/context/form-dialog-context";
import { useI18n } from "#/context/i18n-context";
import { api } from "#lib/api.ts";
import { formatDate } from "#lib/utils.ts";
import { IconEdit, IconEye, IconShield, IconTrash, IconUsers } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { useState } from "react";
import { toast } from "sonner";

// Role type definition based on backend
type RoleShowResponse = {
  uuid: string;
  name: string;
  slug: string;
  description: string | null;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
};

const colHelper = createColumnHelper<RoleShowResponse>();

export const roleColumns = [
  colHelper.accessor("name", {
    header: () => {
      const { t } = useI18n();
      return t('roles.columns.name');
    },
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <IconShield className="h-4 w-4 text-primary" />
        <div className="font-medium text-foreground">{row.original.name}</div>
      </div>
    ),
  }),

  colHelper.accessor("slug", {
    header: () => 'Slug',
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground font-mono">
        {row.original.slug}
      </div>
    ),
  }),

  colHelper.accessor("description", {
    header: () => {
      const { t } = useI18n();
      return t('roles.columns.description');
    },
    cell: ({ row }) => {
      const description = row.original.description;
      if (!description) {
        return <span className="text-muted-foreground text-sm">-</span>;
      }
      
      return (
        <div className="text-sm max-w-xs truncate" title={description}>
          {description}
        </div>
      );
    },
  }),

  colHelper.accessor("permissions", {
    header: () => {
      const { t } = useI18n();
      return t('roles.columns.permissions');
    },
    cell: ({ row }) => {
      const permissions = row.original.permissions;
      
      if (!permissions || permissions.length === 0) {
        return <span className="text-muted-foreground text-sm">İzin yok</span>;
      }

      if (permissions.includes("*")) {
        return (
          <Badge variant="default" className="text-xs">
            <IconUsers className="h-3 w-3 mr-1" />
            All Permissions
          </Badge>
        );
      }

      return (
        <div className="flex items-center gap-1">
          <Badge variant="secondary" className="text-xs">
            {permissions.length} {permissions.length === 1 ? 'Permission' : 'Permissions'}
          </Badge>
        </div>
      );
    },
  }),

  colHelper.accessor("createdAt", {
    header: () => {
      const { t } = useI18n();
      return t('common.createdAt');
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
      return t('common.updatedAt');
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
      return t('common.actions');
    },
    cell: (info) => {
      const role = info.row.original;
      return <RoleActions role={role} />;
    },
  }),
] as ColumnDef<RoleShowResponse>[];

interface RoleActionsProps {
  role: RoleShowResponse;
}

function RoleActions({ role }: RoleActionsProps) {
  const { openFormDialog, closeFormDialog } = useFormDialog();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showModalOpen, setShowModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const isAdminRole = role.uuid === "admin";

  const handleView = () => {
    setShowModalOpen(true);
  };

  const handleEdit = () => {
    openFormDialog({
      title: "Rol Düzenle",
      content: <RoleUpdateForm role={role} onSuccess={closeFormDialog} />,
      maxWidth: "sm:max-w-[700px]",
    });
  };

  const handleDeleteClick = () => {
    if (isAdminRole) {
      toast.error("Admin rolü silinemez");
      return;
    }
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const response = await api
        .roles({
          uuid: role.uuid,
        })
        .delete();

      if (response.data) {
        toast.success("Rol başarıyla silindi");
        queryClient.invalidateQueries({ queryKey: ["roles"] });
        setDeleteDialogOpen(false);
      } else {
        toast.error("Rol silinirken bir hata oluştu");
      }
    } catch (error) {
      toast.error("Rol silinirken bir hata oluştu");
    } finally {
      setIsDeleting(false);
    }
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
          onClick={handleView}
        >
          <IconEye className="h-4 w-4" />
        </Button>

        {/* Edit Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleEdit}
          title="Düzenle"
          disabled={isAdminRole}
        >
          <IconEdit className="h-4 w-4" />
        </Button>

        {/* Delete Button */}
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${isAdminRole 
            ? "text-gray-400 cursor-not-allowed" 
            : "text-red-600 hover:text-red-700 hover:bg-red-50"
          }`}
          onClick={handleDeleteClick}
          title={isAdminRole ? "Admin rolü silinemez" : "Sil"}
          disabled={isAdminRole}
        >
          <IconTrash className="h-4 w-4" />
        </Button>
      </div>

      {/* Role Show Modal */}
      <RoleShowModal
        isOpen={showModalOpen}
        onClose={() => setShowModalOpen(false)}
        roleData={role}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Rolü Sil"
        desc={
          <div>
            <p className="mb-2">
              <strong>"{role.name}"</strong> rolünü silmek istediğinizden
              emin misiniz?
            </p>
            <p className="text-sm text-muted-foreground">
              Bu işlem geri alınamaz ve rol ile ilgili tüm veriler
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