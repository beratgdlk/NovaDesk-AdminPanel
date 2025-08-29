import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Separator } from "#/components/ui/separator";
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <IconUser className="h-6 w-6 text-primary" />
            Kullanıcı Detayları
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Ana Bilgiler Kartı */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <IconUser className="h-5 w-5 text-muted-foreground" />
              Kişisel Bilgiler
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Ad
                </label>
                <p className="text-base font-medium">{user.firstName}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Soyad
                </label>
                <p className="text-base font-medium">{user.lastName}</p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <IconMail className="h-4 w-4" />
                  E-posta
                </label>
                <p className="text-base text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Durum ve Roller Kartı */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <IconShield className="h-5 w-5 text-muted-foreground" />
              Yetki ve Durum
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <IconUserCheck className="h-4 w-4" />
                  Durum
                </label>
                <div>
                  <Badge variant={user.isActive ? "default" : "secondary"} className="text-sm">
                    {user.isActive ? "Aktif" : "Pasif"}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Roller
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
                      Rol atanmamış
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Acente
                </label>
                <div>
                  {user.agent ? (
                    <Badge variant="outline" className="text-xs">
                      {user.agent.name}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Acente atanmamış
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
              Tarih Bilgileri
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Oluşturulma Tarihi
                </label>
                <p className="text-sm text-muted-foreground">
                  {formatDate(user.createdAt, "dd MMMM yyyy, HH:mm")}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Son Güncellenme
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
                  Kullanıcı ID
                </label>
                <p className="text-xs font-mono text-muted-foreground mt-1">
                  {user.id}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(user.id)}
                className="text-xs"
              >
                Kopyala
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Alt Butonlar */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Kapat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 