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
import { type AgentShowResponse } from "#backend/modules/agents/types";
import { api } from "#lib/api.ts";
import { useQueryClient } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import { HTMLAttributes, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type AgentUpdateFormProps = HTMLAttributes<HTMLFormElement> & {
  agent: AgentShowResponse;
  onSuccess?: () => void;
};

type FormData = {
  name: string;
  insurupAgentId: string;
};

export function AgentUpdateForm({
  agent,
  onSuccess,
  className,
  ...props
}: AgentUpdateFormProps) {
  const form = useForm<FormData>({
    defaultValues: {
      name: "",
      insurupAgentId: "",
    },
  });
  const queryClient = useQueryClient();
  // Pre-populate form when agent data is available
  useEffect(() => {
    if (agent) {
      form.reset({
        name: agent.name,
        insurupAgentId: agent.insurupAgentId,
      });
    }
  }, [agent, form]);

  async function onSubmit(data: FormData) {
    if (!agent) return;

    const response = await api
      .agents({
        uuid: agent.uuid,
      })
      .put({
        name: data.name,
        insurupAgentId: data.insurupAgentId,
      });

    if (response.data) {
      toast.success("Acente başarıyla güncellendi");
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      onSuccess?.();
    } else {
      toast.error("Acente güncellenirken bir hata oluştu");
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
          <h3 className="text-lg font-semibold">Acente Bilgilerini Güncelle</h3>

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
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="min-w-32"
          >
            Acenteyi Güncelle
            {form.formState.isSubmitting && <Loader className="animate-spin" />}
          </Button>
        </div>
      </form>
    </Form>
  );
}
