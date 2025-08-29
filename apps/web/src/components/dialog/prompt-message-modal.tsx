import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Textarea } from "#/components/ui/textarea";
import { type AgentUpdatePayload } from "#backend/modules/agents/types";
import { api } from "#lib/api.ts";
import useAgentStore from "#stores/agent-store.ts";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface PromptMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export function PromptMessageModal({
  isOpen,
  onClose,
  title = "Pop-Up",
}: PromptMessageModalProps) {
  const { agent } = useAgentStore();
  const queryClient = useQueryClient();
  const { handleSubmit, register, reset, watch } = useForm<AgentUpdatePayload>({
    defaultValues: {
      ...agent,
    },
  });

  const welcomeMessage = watch("chatbotInstructions.welcomeMessage") || "";
  const maxChars = 150;

  const onSubmit = async (data: AgentUpdatePayload) => {
    if (!agent?.uuid) return;

    try {
      const response = await api.agents({ uuid: agent?.uuid }).put(data as any);
      if (response.data) {
        toast.success("Başlangıç mesajı güncellendi");
        queryClient.invalidateQueries({ queryKey: ["agent"] });
      } else {
        toast.error("Başlangıç mesajı güncellenemedi");
      }
    } catch (error) {
      toast.error("Başlangıç mesajı güncellenemedi");
    }

    onClose();
  };

  useEffect(() => {
    if (isOpen && agent) {
      reset({
        ...agent,
      });
    }
  }, [isOpen, agent, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Textarea
              {...register("chatbotInstructions.welcomeMessage", {
                maxLength: {
                  value: maxChars,
                  message: `Maksimum ${maxChars} karakter girebilirsiniz`,
                },
              })}
              className="min-h-[200px] text-base resize-none"
              placeholder="Başlangıç mesajınızı buraya yazın..."
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-muted-foreground">
                {welcomeMessage.length}/{maxChars} karakter
              </span>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-8"
            >
              Kaydet
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
