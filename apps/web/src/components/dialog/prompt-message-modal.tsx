import { Button } from "#/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "#/components/ui/dialog";
import { Textarea } from "#/components/ui/textarea";
import { useI18n } from "#/context/i18n-context.tsx";
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
  title,
}: PromptMessageModalProps) {
  const { agent } = useAgentStore();
  const queryClient = useQueryClient();
  const { handleSubmit, register, reset, watch } = useForm<AgentUpdatePayload>({
    defaultValues: {
      ...agent,
    },
  });
  const { t } = useI18n();

  const welcomeMessage = watch("chatbotInstructions.welcomeMessage") || "";
  const maxChars = 150;

  const onSubmit = async (data: AgentUpdatePayload) => {
    if (!agent?.uuid) return;

    try {
      const response = await api.agents({ uuid: agent?.uuid }).put(data as any);
      if (response.data) {
        toast.success(t('agents.modals.welcome.saveSuccess'));
        queryClient.invalidateQueries({ queryKey: ["agent"] });
      } else {
        toast.error(t('agents.modals.welcome.saveError'));
      }
    } catch (error) {
      toast.error(t('agents.modals.welcome.saveError'));
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
          <DialogTitle className="text-xl font-bold">{title ?? t('agents.modals.popUpTitle')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Textarea
              {...register("chatbotInstructions.welcomeMessage", {
                maxLength: {
                  value: maxChars,
                  message: `${t('common.maxCharsPrefix')} ${maxChars} ${t('common.maxCharsSuffix')}`,
                },
              })}
              className="min-h-[200px] text-base resize-none"
              placeholder={t('agents.modals.welcome.placeholder')}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-muted-foreground">
                {welcomeMessage.length}/{maxChars} {t('common.characters')}
              </span>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-8"
            >
              {t('common.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
