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
import { cn } from "#/lib/utils";
import { api } from "#lib/api.ts";
import { useQueryClient } from "@tanstack/react-query";
import { HTMLAttributes, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type AgentCreateFormProps = HTMLAttributes<HTMLFormElement> & {
  onSuccess?: () => void;
};

type FormData = {
  name: string;
  insurupAgentId: string;
};

export function AgentCreateForm({
  onSuccess,
  className,
  ...props
}: AgentCreateFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    defaultValues: {
      name: "",
      insurupAgentId: "",
    },
  });

  const queryClient = useQueryClient();

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    const response = await api.agents.index.post({
      name: data.name,
      insurupAgentId: data.insurupAgentId,
      domains: [],
      chatbotImageFile: undefined,
      whatsappIntegrationConfig: {
        isEnabled: false,
      },
      chatbotInstructions: {},
      chatbotConfig: {},
    });

    if (response.data) {
      toast.success("Acente başarıyla oluşturuldu!");
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      onSuccess?.();
    } else {
      toast.error("Acente oluşturulurken bir hata oluştu");
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("space-y-6", className)}
        {...props}
      >
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Acente Bilgileri</h3>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Acente Adı</FormLabel>
                <FormControl>
                  <Input placeholder="Acentenizin adını girin" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="insurupAgentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Insurup Agent ID</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Insurup'dan aldığınız agent ID'yi girin"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-6">
          <Button type="submit" disabled={isLoading} className="min-w-32">
            {isLoading ? "Oluşturuluyor..." : "Acente Oluştur"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
