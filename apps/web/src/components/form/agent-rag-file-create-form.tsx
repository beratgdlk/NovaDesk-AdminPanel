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
import { type AgentRagFileCreatePayload } from "#backend/types.ts";
import { api } from "#lib/api.ts";
import { useQueryClient } from "@tanstack/react-query";
import { Loader, Upload } from "lucide-react";
import { HTMLAttributes, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type AgentRagFileCreateFormProps = HTMLAttributes<HTMLFormElement> & {
  agentUuid: string;
  onSuccess?: () => void;
};

export function AgentRagFileCreateForm({
  agentUuid,
  onSuccess,
  className,
  ...props
}: AgentRagFileCreateFormProps) {
  const form = useForm<AgentRagFileCreatePayload>({
    defaultValues: {
      name: "",
    },
  });
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function onSubmit(data: AgentRagFileCreatePayload) {
    if (!data.file || !data.name.trim()) return;

    try {
      const response = await api
        .agents({ uuid: agentUuid })
        .documents.post(data);

      if (response.data) {
        toast.success("Döküman başarıyla yüklendi");
        queryClient.invalidateQueries({ queryKey: ["agent-rag-documents"] });
        form.reset();
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        onSuccess?.();
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Döküman yüklenirken bir hata oluştu");
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("file", file);
      if (!form.getValues("name")) {
        // Auto-fill name if empty
        form.setValue("name", file.name.replace(/\.[^/.]+$/, ""));
      }
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
          <h3 className="text-lg font-semibold">Döküman Ekle</h3>

          <FormField
            control={form.control}
            name="file"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dosya</FormLabel>
                <FormControl>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      handleFileChange(e);
                      field.onChange(e.target.files?.[0] || null);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
            disabled={
              form.formState.isSubmitting ||
              !form.watch("file") ||
              !form.watch("name")
            }
            className="min-w-32"
          >
            <Upload className="w-4 h-4 mr-2" />
            Dökümanı Yükle
            {form.formState.isSubmitting && (
              <Loader className="animate-spin ml-2" />
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
