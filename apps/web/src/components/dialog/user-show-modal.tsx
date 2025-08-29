import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Separator } from "#/components/ui/separator";
import { useI18n } from "#/context/i18n-context.tsx";
import { formatDate } from "#lib/utils.ts";
import {
  IconCalendar,
  IconMail,
  IconShield,
  IconUser,
  IconUserCheck,
} from "@tabler/icons-react";
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

interface UserShowModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserShowResponse | null;
}

export function UserShowModal({ isOpen, onClose, user }: UserShowModalProps) {
  if (!user) return null;
  const { t } = useI18n();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <IconUser className="h-6 w-6 text-primary" />
            {t('users.modal.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Ana Bilgiler Kartı */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <IconUser className="h-5 w-5 text-muted-foreground" />
              {t('users.modal.personalInfo')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t('users.columns.firstName')}
                </label>
                <p className="text-base font-medium">{user.firstName}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t('users.columns.lastName')}
                </label>
                <p className="text-base font-medium">{user.lastName}</p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <IconMail className="h-4 w-4" />
                  {t('users.columns.email')}
                </label>
                <p className="text-base text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Durum ve Roller Kartı */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <IconShield className="h-5 w-5 text-muted-foreground" />
              {t('users.modal.permissionsStatus')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <IconUserCheck className="h-4 w-4" />
                  {t('common.status')}
                </label>
                <div>
                  <Badge variant={user.isActive ? "default" : "secondary"} className="text-sm">
                    {user.isActive ? t('common.active') : t('common.inactive')}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t('users.columns.roles')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {user.rolesSlugs && user.rolesSlugs.length > 0 ? (
                    user.rolesSlugs.map((role) => (
                      <Badge key={role} variant="outline" className="text-xs">
                        {role}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {t('users.modal.noRoles')}
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t('users.columns.agent')}
                </label>
                <div>
                  {user.agent ? (
                    <Badge variant="outline" className="text-xs">
                      {user.agent.name}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {t('users.modal.noAgent')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tarih Bilgileri Kartı */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <IconCalendar className="h-5 w-5 text-muted-foreground" />
              {t('users.modal.dates')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t('common.createdAt')}
                </label>
                <p className="text-sm text-muted-foreground">
                  {formatDate(user.createdAt, "dd MMMM yyyy, HH:mm")}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t('common.updatedAt')}
                </label>
                <p className="text-sm text-muted-foreground">
                  {formatDate(user.updatedAt, "dd MMMM yyyy, HH:mm")}
                </p>
              </div>
            </div>
          </div>

          {/* Kullanıcı ID Kartı */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t('users.modal.userId')}
                </label>
                <p className="text-xs font-mono text-muted-foreground mt-1">
                  {user.id}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(String(user.id))}
                className="text-xs"
              >
                {t('common.copy')}
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Alt Butonlar */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 