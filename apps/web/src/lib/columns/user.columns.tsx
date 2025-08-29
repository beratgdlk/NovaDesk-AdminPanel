import { ConfirmDialog } from "#/components/confirm-dialog";
import { UserShowModal } from "#/components/dialog/user-show-modal";
import { UserUpdateForm } from "#/components/form/user-update-form";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { useFormDialog } from "#/context/form-dialog-context";
import { api } from "#lib/api.ts";
import { formatDate } from "#lib/utils.ts";
import { IconEdit, IconEye, IconTrash } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { useState } from "react";
import { toast } from "sonner";
type UserShowResponse = {
  id: string | number;
  firstName: string;
  lastName: string;
  email: string;
  rolesSlugs?: string[];
  agent?: { uuid: string; name: string } | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
};

const colHelper = createColumnHelper<UserShowResponse>();

export const userColumns = [
  colHelper.accessor("firstName", {
    header: "Ad",
    cell: ({ row }) => (
      <div className="font-medium text-foreground">
        {row.original.firstName}
      </div>
    ),
  }),

  colHelper.accessor("lastName", {
    header: "Soyad",
    cell: ({ row }) => (
      <div className="font-medium text-foreground">{row.original.lastName}</div>
    ),
  }),

  colHelper.accessor("email", {
    header: "E-posta",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">{row.original.email}</div>
    ),
  }),

  colHelper.accessor("rolesSlugs", {
    header: "Roller",
    cell: ({ row }) => {
      const roles = row.original.rolesSlugs;
      if (!roles || roles.length === 0) {
        return <span className="text-muted-foreground">-</span>;
      }

      return (
        <div className="flex flex-wrap gap-1">
          {roles.slice(0, 2).map((role) => (
            <Badge key={role} variant="secondary" className="text-xs">
              {role}
            </Badge>
          ))}
          {roles.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{roles.length - 2}
            </Badge>
          )}
        </div>
      );
    },
  }),

  colHelper.accessor("agent", {
    header: "Acente",
    cell: ({ row }) => {
      const agent = row.original.agent;
      if (!agent) {
        return <span className="text-muted-foreground">-</span>;
      }

      return (
        <Badge variant="outline" className="text-xs">
          {agent.name}
        </Badge>
      );
    },
  }),

  colHelper.accessor("isActive", {
    header: "Durum",
    cell: ({ row }) => {
      const isActive = row.original.isActive;

      return (
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Aktif" : "Pasif"}
        </Badge>
      );
    },
  }),

  colHelper.accessor("createdAt", {
    header: "Oluşturulma Tarihi",
    cell: ({ row }) => {
      return (
        <div className="text-sm text-muted-foreground">
          {formatDate(row.original.createdAt, "dd.MM.yyyy HH:mm")}
        </div>
      );
    },
  }),

  colHelper.accessor("updatedAt", {
    header: "Güncellenme Tarihi",
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
    header: "İşlemler",
    cell: (info) => {
      const user = info.row.original;
      return <UserActions user={user} />;
    },
  }),
] as ColumnDef<UserShowResponse>[];

interface UserActionsProps {
  user: UserShowResponse;
}

function UserActions({ user }: UserActionsProps) {
  const { openFormDialog, closeFormDialog } = useFormDialog();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showModalOpen, setShowModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const handleView = () => {
    setShowModalOpen(true);
  };

  const handleEdit = () => {
    openFormDialog({
      title: "Kullanıcı Düzenle",
      content: <UserUpdateForm user={user} onSuccess={closeFormDialog} />,
      maxWidth: "sm:max-w-[700px]",
    });
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const response = await api
        .users({
          id: user.id,
        })
        .delete();

      if (response.data) {
        toast.success("Kullanıcı başarıyla silindi");
        queryClient.invalidateQueries({ queryKey: ["users"] });
        setDeleteDialogOpen(false);
      } else {
        toast.error("Kullanıcı silinirken bir hata oluştu");
      }
    } catch (error) {
      toast.error("Kullanıcı silinirken bir hata oluştu");
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

      {/* User Show Modal */}
      <UserShowModal
        isOpen={showModalOpen}
        onClose={() => setShowModalOpen(false)}
        user={user}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Kullanıcıyı Sil"
        desc={
          <div>
            <p className="mb-2">
              <strong>"{user.firstName} {user.lastName}"</strong> kullanıcısını silmek istediğinizden
              emin misiniz?
            </p>
            <p className="text-sm text-muted-foreground">
              Bu işlem geri alınamaz ve kullanıcı ile ilgili tüm veriler
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
