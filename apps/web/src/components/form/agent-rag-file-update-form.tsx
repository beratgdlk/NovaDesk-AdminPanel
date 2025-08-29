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
import {
    type AgentRagFileShowResponse,
    type AgentRagFileUpdatePayload,
} from "#backend/types.ts";
import { api } from "#lib/api.ts";
import { useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { HTMLAttributes, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type AgentRagFileUpdateFormProps = HTMLAttributes<HTMLFormElement> & {
  agentUuid: string;
  document: AgentRagFileShowResponse;
  onSuccess?: () => void;
};

export function AgentRagFileUpdateForm({
  agentUuid,
  document,
  onSuccess,
  className,
  ...props
}: AgentRagFileUpdateFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AgentRagFileUpdatePayload>({
    defaultValues: {
      name: "",
    },
  });
  const queryClient = useQueryClient();

  // Pre-populate form when document data is available
  useEffect(() => {
    if (document) {
      form.reset({
        name: document.title || document.name,
      });
    }
  }, [document, form]);

  async function onSubmit(data: AgentRagFileUpdatePayload) {
    if (!data.name?.trim()) return;

    const response = await api
      .agents({ uuid: agentUuid })
      .documents({ documentUuid: document.uuid })
      .patch(data);

    if (response.data) {
      toast.success("Döküman başarıyla güncellendi");
      queryClient.invalidateQueries({ queryKey: ["agent-rag-documents"] });
      onSuccess?.();
    } else {
      toast.error("Döküman güncellenirken bir hata oluştu");
    }

    setIsLoading(false);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("space-y-6", className)}
        {...props}
      >
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Döküman Düzenle</h3>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Döküman Adı</FormLabel>
                <FormControl>
                  <Input placeholder="Döküman adını girin" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-6">
          <Button
            type="submit"
            disabled={isLoading || !form.watch("name")}
            className="min-w-32"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Güncelleniyor..." : "Dökümanı Güncelle"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
