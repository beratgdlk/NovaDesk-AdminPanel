import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "#/components/ui/form";
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";
import { cn } from "#/lib/utils";
import { api } from "#lib/api.ts";
import { useQueryClient } from "@tanstack/react-query";
import { HTMLAttributes, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type RoleCreateFormProps = HTMLAttributes<HTMLFormElement> & {
  onSuccess?: () => void;
};

type FormData = {
  name: string;
  description?: string;
  permissions: string[];
};

// Available permissions (bu liste backend'den gelecek şekilde de yapılabilir)
const AVAILABLE_PERMISSIONS = [
  { key: "users:show", description: "Kullanıcıları Görüntüle", group: "Kullanıcılar" },
  { key: "users:create", description: "Kullanıcı Oluştur", group: "Kullanıcılar" },
  { key: "users:update", description: "Kullanıcı Güncelle", group: "Kullanıcılar" },
  { key: "users:destroy", description: "Kullanıcı Sil", group: "Kullanıcılar" },
  { key: "users:update-roles", description: "Kullanıcı Rollerini Güncelle", group: "Kullanıcılar" },
  { key: "roles:show", description: "Rolleri Görüntüle", group: "Roller" },
  { key: "roles:update", description: "Rolleri Güncelle", group: "Roller" },
  { key: "agents:show", description: "Acenteleri Görüntüle", group: "Acenteler" },
  { key: "agents:create", description: "Acente Oluştur", group: "Acenteler" },
  { key: "agents:update", description: "Acente Güncelle", group: "Acenteler" },
  { key: "agents:destroy", description: "Acente Sil", group: "Acenteler" },
  { key: "posts:show", description: "Gönderileri Görüntüle", group: "Gönderiler" },
  { key: "posts:create", description: "Gönderi Oluştur", group: "Gönderiler" },
  { key: "posts:update", description: "Gönderi Güncelle", group: "Gönderiler" },
  { key: "posts:destroy", description: "Gönderi Sil", group: "Gönderiler" },
  { key: "system-administration:show-logs", description: "Logları Görüntüle", group: "Sistem Yönetimi" },
];

// Group permissions by category
const PERMISSION_GROUPS = AVAILABLE_PERMISSIONS.reduce((acc, permission) => {
  if (!acc[permission.group]) {
    acc[permission.group] = [];
  }
  acc[permission.group].push(permission);
  return acc;
}, {} as Record<string, typeof AVAILABLE_PERMISSIONS>);

export function RoleCreateForm({
  onSuccess,
  className,
  ...props
}: RoleCreateFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    defaultValues: {
      name: "",
      description: "",
      permissions: [],
    },
  });

  const queryClient = useQueryClient();

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    try {
      // @ts-ignore - API type mismatch
      const response = await api.roles.post({
        name: data.name,
        description: data.description || null,
        // @ts-ignore - Permission type mismatch
        permissions: data.permissions,
      });

      if (response.data) {
        toast.success("Rol başarıyla oluşturuldu!");
        queryClient.invalidateQueries({ queryKey: ["roles"] });
        onSuccess?.();
      } else {
        toast.error("Rol oluşturulurken bir hata oluştu");
      }
    } catch (error) {
      toast.error("Rol oluşturulurken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  }

  const watchedPermissions = form.watch("permissions");
  const hasWildcard = watchedPermissions.includes("*");

  const handleWildcardChange = (checked: boolean) => {
    if (checked) {
      form.setValue("permissions", ["*"]);
    } else {
      form.setValue("permissions", []);
    }
  };

  const handlePermissionChange = (permissionKey: string, checked: boolean) => {
    const currentPermissions = form.getValues("permissions");
    
    if (checked) {
      // Remove wildcard if adding specific permission
      const newPermissions = currentPermissions.filter(p => p !== "*");
      newPermissions.push(permissionKey);
      form.setValue("permissions", newPermissions);
    } else {
      const newPermissions = currentPermissions.filter(p => p !== permissionKey);
      form.setValue("permissions", newPermissions);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("space-y-6", className)}
        {...props}
      >
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Rol Bilgileri</h3>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rol Adı</FormLabel>
                <FormControl>
                  <Input placeholder="Rol adını girin" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Açıklama</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Rol açıklamasını girin (isteğe bağlı)"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Permissions Section */}
          <div className="space-y-4">
            <FormLabel className="text-base font-medium">İzinler</FormLabel>
            
            {/* Wildcard Option */}
            <div className="flex items-center space-x-2 p-3 border rounded-lg bg-muted/50">
              <Checkbox
                id="wildcard"
                checked={hasWildcard}
                onCheckedChange={handleWildcardChange}
                disabled={isLoading}
              />
              <label htmlFor="wildcard" className="text-sm font-medium cursor-pointer">
                Tüm İzinler (*) - Sisteme tam erişim
              </label>
            </div>

            {/* Specific Permissions */}
            {!hasWildcard && (
              <div className="space-y-4">
                {Object.entries(PERMISSION_GROUPS).map(([groupName, permissions]) => (
                  <div key={groupName} className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      {groupName}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-4">
                      {permissions.map((permission) => (
                        <div key={permission.key} className="flex items-center space-x-2">
                          <Checkbox
                            id={permission.key}
                            checked={watchedPermissions.includes(permission.key)}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(permission.key, checked as boolean)
                            }
                            disabled={isLoading}
                          />
                          <label
                            htmlFor={permission.key}
                            className="text-xs cursor-pointer"
                          >
                            {permission.description}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-6">
          <Button type="submit" disabled={isLoading} className="min-w-32">
            {isLoading ? "Oluşturuluyor..." : "Rol Oluştur"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 