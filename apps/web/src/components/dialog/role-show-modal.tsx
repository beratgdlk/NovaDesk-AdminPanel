import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "#/components/ui/dialog";
import { formatDate } from "#lib/utils.ts";
import {
    IconCalendar,
    IconInfoCircle,
    IconKey,
    IconShield,
    IconUsers,
} from "@tabler/icons-react";

// Role type for modal props
type RoleShowResponse = {
  uuid: string;
  name: string;
  slug: string;
  description: string | null;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
};

interface RoleShowModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleData: RoleShowResponse | null;
}

export function RoleShowModal({ isOpen, onClose, roleData }: RoleShowModalProps) {
  if (!roleData) return null;

  const hasWildcard = roleData.permissions.includes("*");
  const permissionCount = roleData.permissions.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <IconShield className="h-6 w-6 text-primary" />
            Rol Detayları
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Ana Bilgiler Kartı */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <IconInfoCircle className="h-5 w-5 text-muted-foreground" />
              Temel Bilgiler
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Rol Adı
                </label>
                <p className="text-base font-medium">{roleData.name}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Slug
                </label>
                <p className="text-base font-mono text-muted-foreground">{roleData.slug}</p>
              </div>
              {roleData.description && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Açıklama
                  </label>
                  <p className="text-base text-foreground bg-muted/50 p-3 rounded-md">
                    {roleData.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* İzinler Kartı */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <IconKey className="h-5 w-5 text-muted-foreground" />
              İzinler ve Yetkiler
            </h3>
            
            {hasWildcard ? (
              <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <IconUsers className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-medium text-primary">Tam Yetki</p>
                  <p className="text-sm text-muted-foreground">
                    Bu rol sistemdeki tüm işlemleri gerçekleştirebilir.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Toplam İzin Sayısı
                  </p>
                  <Badge variant="secondary">
                    {permissionCount} İzin
                  </Badge>
                </div>
                
                {permissionCount > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {roleData.permissions.map((permission, index) => (
                      <div 
                        key={index}
                        className="flex items-center gap-2 p-2 border rounded-md bg-muted/30"
                      >
                        <IconKey className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs font-mono text-muted-foreground truncate">
                          {permission}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <IconKey className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-muted-foreground">Henüz izin tanımlanmamış</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tarih Bilgileri Kartı */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <IconCalendar className="h-5 w-5 text-muted-foreground" />
              Tarih Bilgileri
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <IconCalendar className="h-4 w-4" />
                  Oluşturulma Tarihi
                </label>
                <p className="text-sm text-foreground">
                  {formatDate(roleData.createdAt, "dd.MM.yyyy HH:mm")}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <IconCalendar className="h-4 w-4" />
                  Son Güncellenme
                </label>
                <p className="text-sm text-foreground">
                  {formatDate(roleData.updatedAt, "dd.MM.yyyy HH:mm")}
                </p>
              </div>
            </div>
          </div>

          {/* ID Bilgileri */}
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Sistem ID
              </label>
              <p className="text-xs font-mono text-muted-foreground break-all">
                {roleData.uuid}
              </p>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Kapat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 