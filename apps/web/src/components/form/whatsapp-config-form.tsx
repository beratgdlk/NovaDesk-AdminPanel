import { Button } from "#/components/ui/button";
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "#/components/ui/form";
import { Input } from "#/components/ui/input";
import { Switch } from "#/components/ui/switch";
import { cn } from "#/lib/utils";
import { type AgentUpdatePayload } from "#backend/modules/agents/types";
import { api } from "#lib/api.ts";
import useAgentStore from "#stores/agent-store.ts";
import { useQueryClient } from "@tanstack/react-query";
import { HTMLAttributes, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

type WhatsAppConfigFormProps = HTMLAttributes<HTMLFormElement>;

export function WhatsAppConfigForm({
  className,
  ...props
}: WhatsAppConfigFormProps) {
  const { agent } = useAgentStore();
  const queryClient = useQueryClient();

  const form = useForm<AgentUpdatePayload>({
    defaultValues: {
      ...agent,
    },
  });

  const { handleSubmit, control, reset } = form;

  const onSubmit = async (data: AgentUpdatePayload) => {
    if (!agent?.uuid) {
      toast.error("Agent bilgisi bulunamadı");
      return;
    }

    try {
      const response = await api.agents({ uuid: agent.uuid }).put(data as any);
      if (response.data) {
        toast.success("WhatsApp konfigürasyonu güncellendi");
        queryClient.invalidateQueries({ queryKey: ["agent"] });
      } else {
        toast.error("WhatsApp konfigürasyonu güncellenemedi");
      }
    } catch (error) {
      toast.error("Bir hata oluştu");
      console.error("WhatsApp config update error:", error);
    }
  };

  useEffect(() => {
    if (agent) {
      reset({
        ...agent,
      });
    }
  }, [agent, reset]);

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={cn("grid gap-4", className)}
        {...props}
      >
        <Controller
          name="whatsappIntegrationConfig.isEnabled"
          control={control}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  WhatsApp Entegrasyonunu Etkinleştir
                </FormLabel>
                <div className="text-sm text-muted-foreground">
                  WhatsApp chatbot entegrasyonunu aktif/pasif duruma getirir
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Controller
          name="whatsappIntegrationConfig.phoneNumberId"
          control={control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number ID</FormLabel>
              <FormControl>
                <Input
                  placeholder="WhatsApp'a mesaj göndereceğiniz numarayı belirtmek için"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Controller
          name="whatsappIntegrationConfig.accessToken"
          control={control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Access Token</FormLabel>
              <FormControl>
                <Input
                  placeholder="Meta Graph API'ye erişmek için gerekli kimlik doğrulama bilgisi"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Controller
          name="whatsappIntegrationConfig.businessAccountId"
          control={control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Account ID</FormLabel>
              <FormControl>
                <Input
                  placeholder="Meta tarafından işletme doğrulaması için gerekir"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Controller
          name="whatsappIntegrationConfig.appId"
          control={control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>App ID</FormLabel>
              <FormControl>
                <Input
                  placeholder="Meta uygulamasıyla ilişkilendirmek için"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Controller
          name="whatsappIntegrationConfig.webhookVerifyToken"
          control={control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Webhook Verify Token</FormLabel>
              <FormControl>
                <Input
                  placeholder="Webhook doğrulama sırasında kullanılır"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="mt-4 w-75 ml-auto bg-green-600 hover:bg-green-700 text-white"
        >
          Kaydet
        </Button>
      </form>
    </Form>
  );
}
