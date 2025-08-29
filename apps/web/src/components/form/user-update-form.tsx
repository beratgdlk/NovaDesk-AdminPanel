import { Button } from "#/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "#/components/ui/form";
import { Input } from "#/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "#/components/ui/select";
import { cn } from "#/lib/utils";
import { api } from "#lib/api.ts";
import { IconBuilding, IconShield } from "@tabler/icons-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import { HTMLAttributes, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
type UserShowResponse = {
  id: string | number;
  firstName: string;
  lastName: string;
  email: string;
  rolesSlugs?: string[];
  agent?: { uuid: string; name: string } | null;
  isActive: boolean;
};
type UserUpdatePayload = {
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  agentUuid?: string | null;
};

type UserUpdateFormProps = HTMLAttributes<HTMLFormElement> & {
  user: UserShowResponse;
  onSuccess?: () => void;
};

// Role type for API response
type RoleResponse = {
  uuid: string;
  name: string;
  slug: string;
  description: string | null;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
};

// Agent type for API response
type AgentResponse = {
  uuid: string;
  name: string;
  insurupAgentId: string;
  createdAt: Date;
  updatedAt: Date;
};

// Extended form data to include roles and agent
type FormData = UserUpdatePayload & {
  roleSlug?: string; // Single role selection
  agentUuid?: string; // Optional agent selection
};

export function UserUpdateForm({
  user,
  onSuccess,
  className,
  ...props
}: UserUpdateFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isActive: user.isActive,
      roleSlug: user.rolesSlugs?.[0] || "", // Take first role if exists
      agentUuid: user.agent?.uuid || "none",
    },
  });

  const queryClient = useQueryClient();

  // Fetch roles for selection
  const { data: rolesResponse } = useQuery({
    queryKey: ["roles"],
    // @ts-ignore
    queryFn: () => api.roles.get({}),
  });

  // Fetch agents for selection
  const { data: agentsResponse } = useQuery({
    queryKey: ["agents"],
    // @ts-ignore
    queryFn: () => api.agents.index.get({}),
  });

  const roles = (rolesResponse?.data ?? []) as RoleResponse[];
  const agents = (agentsResponse?.data?.data ?? []) as AgentResponse[];

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    try {
      // Update basic user info
      const userUpdateResponse = await api
        .users({
          id: user.id,
        })
        .patch({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          isActive: data.isActive,
          agentUuid: data.agentUuid && data.agentUuid !== "none" ? data.agentUuid : null,
        });

      // Update user roles separately if they've changed
      const currentRoles = user.rolesSlugs || [];
      const newRoles = data.roleSlug ? [data.roleSlug] : [];
      
      if (JSON.stringify(currentRoles.sort()) !== JSON.stringify(newRoles.sort())) {
        await api
          .users({
            id: user.id,
          })
          .roles.patch({
            rolesSlugs: newRoles,
          });
      }

      if (userUpdateResponse.data) {
        toast.success("Kullanıcı başarıyla güncellendi!");
        queryClient.invalidateQueries({ queryKey: ["users"] });
        onSuccess?.();
      } else {
        toast.error("Kullanıcı güncellenirken bir hata oluştu");
      }
    } catch (error) {
      toast.error("Kullanıcı güncellenirken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("space-y-6", className)}
        {...props}
      >
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Kullanıcı Bilgilerini Güncelle</h3>

          {/* Personal Information Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ad</FormLabel>
                  <FormControl>
                    <Input placeholder="Kullanıcının adını girin" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Soyad</FormLabel>
                  <FormControl>
                    <Input placeholder="Kullanıcının soyadını girin" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Contact Information - Full Width */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-posta</FormLabel>
                <FormControl>
                  <Input 
                    type="email"
                    placeholder="kullanici@example.com" 
                    className="h-11"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status - Full Width */}
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Durum</FormLabel>
                <Select onValueChange={(value) => field.onChange(value === "true")} value={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Durum seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="true">Aktif</SelectItem>
                    <SelectItem value="false">Pasif</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Role and Agent Assignment Section */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-muted-foreground border-b pb-2">
              Yetki ve Atamalar
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="roleSlug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Rol seçin">
                            {field.value && (
                              <div className="flex items-center gap-2">
                                <IconShield className="h-4 w-4 text-primary" />
                                {roles.find(r => r.slug === field.value)?.name}
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.length > 0 ? (
                          roles.map((role) => (
                            <SelectItem key={role.uuid} value={role.slug}>
                              <div className="flex items-center gap-2">
                                <IconShield className="h-4 w-4 text-primary" />
                                <div className="flex flex-col">
                                  <span>{role.name}</span>
                                  {role.description && (
                                    <span className="text-xs text-muted-foreground">
                                      {role.description}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-roles" disabled>
                            Henüz rol tanımlanmamış
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agentUuid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Acente (Opsiyonel)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Acente seçin">
                            {field.value && field.value !== "none" && (
                              <div className="flex items-center gap-2">
                                <IconBuilding className="h-4 w-4 text-primary" />
                                {agents.find(a => a.uuid === field.value)?.name}
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Acente seçilmedi</span>
                          </div>
                        </SelectItem>
                        {agents.length > 0 ? (
                          agents.map((agent) => (
                            <SelectItem key={agent.uuid} value={agent.uuid}>
                              <div className="flex items-center gap-2">
                                <IconBuilding className="h-4 w-4 text-primary" />
                                <div className="flex flex-col">
                                  <span>{agent.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    ID: {agent.insurupAgentId}
                                  </span>
                                </div>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-agents" disabled>
                            Henüz acente tanımlanmamış
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-6">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="min-w-32"
          >
            Kullanıcıyı Güncelle
            {form.formState.isSubmitting && <Loader className="ml-2 h-4 w-4 animate-spin" />}
          </Button>
        </div>
      </form>
    </Form>
  );
} 