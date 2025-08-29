import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { RadioGroup } from "#/components/ui/radio-group";
import { Textarea } from "#/components/ui/textarea";
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
  { text: "Samimi", description: "Samimi ses tonu ile konuşuruz." },
  { text: "Profesyonel", description: "Profesyonel ses tonu ile konuşuruz." },
  { text: "Dostane", description: "Dostane ses tonu ile konuşuruz." },
  { text: "Resmi", description: "Resmi ses tonu ile konuşuruz." },
  { text: "Eğlenceli", description: "Eğlenceli ses tonu ile konuşuruz." },
  { text: "Yardımsever", description: "Yardımsever ses tonu ile konuşuruz." },
];

export function VoiceToneModal({
  isOpen,
  onClose,
  title = "Pop-Up",
}: VoiceToneModalProps) {
  const { agent } = useAgentStore();
  const queryClient = useQueryClient();
  const [hoveredDescription, setHoveredDescription] = useState<string>("");

  const { handleSubmit, control, reset, watch } = useForm<AgentUpdatePayload>({
    defaultValues: {
      ...agent,
    },
  });

  const selectedTone = watch("chatbotInstructions.voiceTone");

  // Gösterilecek description: hover varsa hover, yoksa seçili olanın description'ı
  const displayedDescription =
    hoveredDescription ||
    (selectedTone
      ? promptButtons.find((btn) => btn.text === selectedTone)?.description ||
        ""
      : "");

  const onSubmit = async (data: AgentUpdatePayload) => {
    if (!agent?.uuid) return;
    const response = await api.agents({ uuid: agent?.uuid }).put(data as any);
    if (response.data) {
      toast.success("Ses tonu güncellendi");
      queryClient.invalidateQueries({ queryKey: ["agent"] });
    } else {
      toast.error("Ses tonu güncellenemedi");
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

        <div className="space-y-6">
          <div>
            <Textarea
              value={displayedDescription}
              readOnly
              className="min-h-[150px] text-base resize-none bg-muted/50"
              placeholder="Bir ses tonu seçin veya butonun üzerine gelin açıklamasını görmek için..."
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
                        key={button.text}
                        variant="outline"
                        className={`p-6 text-base transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:border-primary ${
                          field.value === button.text
                            ? "bg-primary text-primary-foreground border-primary"
                            : ""
                        }`}
                        onClick={() => field.onChange(button.text)}
                        onMouseEnter={() =>
                          setHoveredDescription(button.description)
                        }
                        onMouseLeave={() => setHoveredDescription("")}
                        type="button"
                      >
                        <span className="text-lg font-medium">
                          {button.text}
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
                    Kaydet
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
