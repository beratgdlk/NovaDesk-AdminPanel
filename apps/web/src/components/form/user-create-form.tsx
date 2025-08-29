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
import { HTMLAttributes, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
type UserCreatePayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  gender: 'MALE' | 'FEMALE' | 'NON_BINARY';
  rolesSlugs: string[];
  isActive?: boolean;
  agentUuid?: string;
};

type UserCreateFormProps = HTMLAttributes<HTMLFormElement> & {
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

// Extended form data to include agentUuid
type FormData = UserCreatePayload & {
  roleSlug?: string; // Single role selection
  agentUuid?: string; // Optional agent selection
};

export function UserCreateForm({
  onSuccess,
  className,
  ...props
}: UserCreateFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      gender: "MALE",
      rolesSlugs: [],
      roleSlug: "",
      agentUuid: "none",
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
      const response = await api.users.post({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        gender: data.gender,
        rolesSlugs: data.roleSlug ? [data.roleSlug] : [],
        isActive: true,
        agentUuid: data.agentUuid && data.agentUuid !== "none" ? data.agentUuid : undefined,
      });

      if (response.data) {
        toast.success("Kullanıcı başarıyla oluşturuldu!");
        queryClient.invalidateQueries({ queryKey: ["users"] });
        onSuccess?.();
      } else {
        toast.error("Kullanıcı oluşturulurken bir hata oluştu");
      }
    } catch (error) {
      toast.error("Kullanıcı oluşturulurken bir hata oluştu");
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
          <h3 className="text-lg font-semibold">Kullanıcı Bilgileri</h3>

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

          {/* Password - Full Width for better UX */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Şifre</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="En az 8 karakter"
                    className="h-11"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Gender - Full Width Select */}
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cinsiyet</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Cinsiyet seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="MALE">Erkek</SelectItem>
                    <SelectItem value="FEMALE">Kadın</SelectItem>
                    <SelectItem value="NON_BINARY">Diğer</SelectItem>
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
          <Button type="submit" disabled={isLoading} className="min-w-32">
            {isLoading ? "Oluşturuluyor..." : "Kullanıcı Oluştur"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
