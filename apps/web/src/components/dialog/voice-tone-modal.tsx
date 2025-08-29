import { Button } from "#/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "#/components/ui/dialog";
import { RadioGroup } from "#/components/ui/radio-group";
import { Textarea } from "#/components/ui/textarea";
import { useI18n } from "#/context/i18n-context.tsx";
import { type AgentUpdatePayload } from "#backend/modules/agents/types";
import { api } from "#lib/api.ts";
import useAgentStore from "#stores/agent-store.ts";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

interface VoiceToneModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

const promptButtons = [
  { key: 'friendly', textKey: 'agents.modals.voiceTone.tones.friendly', descKey: 'agents.modals.voiceTone.descriptions.friendly' },
  { key: 'professional', textKey: 'agents.modals.voiceTone.tones.professional', descKey: 'agents.modals.voiceTone.descriptions.professional' },
  { key: 'amicable', textKey: 'agents.modals.voiceTone.tones.amicable', descKey: 'agents.modals.voiceTone.descriptions.amicable' },
  { key: 'formal', textKey: 'agents.modals.voiceTone.tones.formal', descKey: 'agents.modals.voiceTone.descriptions.formal' },
  { key: 'playful', textKey: 'agents.modals.voiceTone.tones.playful', descKey: 'agents.modals.voiceTone.descriptions.playful' },
  { key: 'helpful', textKey: 'agents.modals.voiceTone.tones.helpful', descKey: 'agents.modals.voiceTone.descriptions.helpful' },
];

export function VoiceToneModal({
  isOpen,
  onClose,
  title,
}: VoiceToneModalProps) {
  const { agent } = useAgentStore();
  const queryClient = useQueryClient();
  const [hoveredDescription, setHoveredDescription] = useState<string>("");
  const { t } = useI18n();

  const { handleSubmit, control, reset, watch } = useForm<AgentUpdatePayload>({
    defaultValues: {
      ...agent,
    },
  });

  const selectedTone = watch("chatbotInstructions.voiceTone");

  // Gösterilecek description: hover varsa hover, yoksa seçili olanın description'ı
  const displayedDescription = hoveredDescription || (selectedTone ? t(`agents.modals.voiceTone.descriptions.${selectedTone}`) : "");

  const onSubmit = async (data: AgentUpdatePayload) => {
    if (!agent?.uuid) return;
    const response = await api.agents({ uuid: agent?.uuid }).put(data as any);
    if (response.data) {
      toast.success(t('agents.modals.voiceTone.saveSuccess'));
      queryClient.invalidateQueries({ queryKey: ["agent"] });
    } else {
      toast.error(t('agents.modals.voiceTone.saveError'));
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

        <div className="space-y-6">
          <div>
            <Textarea
              value={displayedDescription}
              readOnly
              className="min-h-[150px] text-base resize-none bg-muted/50"
              placeholder={t('agents.modals.voiceTone.placeholder')}
            />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Butonlar - Radio Group */}
            <div>
              <Controller
                name="chatbotInstructions.voiceTone"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    className="grid grid-cols-3 gap-4"
                  >
                    {promptButtons.map((button) => (
                      <Button
                        key={button.key}
                        variant="outline"
                        className={`p-6 text-base transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:border-primary ${
                          field.value === button.key
                            ? "bg-primary text-primary-foreground border-primary"
                            : ""
                        }`}
                        onClick={() => field.onChange(button.key)}
                        onMouseEnter={() => setHoveredDescription(t(button.descKey))}
                        onMouseLeave={() => setHoveredDescription("")}
                        type="button"
                      >
                        <span className="text-lg font-medium">
                          {t(button.textKey)}
                        </span>
                      </Button>
                    ))}
                  </RadioGroup>
                )}
              />
            </div>

            {/* Kaydet Butonu */}
            <div className="flex justify-end">
              <Controller
                name="chatbotInstructions.voiceTone"
                control={control}
                render={({ field }) => (
                  <Button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white px-8"
                    disabled={!field.value}
                  >
                    {t('common.save')}
                  </Button>
                )}
              />
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
