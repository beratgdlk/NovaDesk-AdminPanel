import { Button } from "#/components/ui/button";
import { ColorPicker } from "#/components/ui/color-picker";
import {
  Form,
  FormControl,
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

import {
  AgentUpdatePayload,
  ChatbotConfig,
} from "#backend/modules/agents/types";

import { api } from "#lib/api.ts";
import { getAsset } from "#lib/asset.ts";

import useAgentStore from "#stores/agent-store.ts";
import { useQueryClient } from "@tanstack/react-query";
import { HTMLAttributes, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

type ChatbotConfigFormProps = HTMLAttributes<HTMLFormElement> & {
  onConfigChange?: (
    config: ChatbotConfig & { chatbotImageFile?: File }
  ) => void;
};

export function ChatbotConfigForm({
  className,
  onConfigChange,
  ...props
}: ChatbotConfigFormProps) {
  const { agent } = useAgentStore();
  const queryClient = useQueryClient();

  const [selectedFilePreview, setSelectedFilePreview] = useState<string | null>(
    null
  );

  const form = useForm<ChatbotConfig & { chatbotImageFile?: File }>({
    defaultValues: {
      ...agent?.chatbotConfig,
    },
  });

  const { handleSubmit, control, reset } = form;

  const onSubmit = async ({
    chatbotImageFile,
    ...data
  }: ChatbotConfig & { chatbotImageFile?: File }) => {
    if (!agent?.uuid) {
      toast.error("Agent bilgisi bulunamadı");
      return;
    }

    // JSON alanlarını FormData için stringify et
    const formData: AgentUpdatePayload = {
      chatbotImageFile: chatbotImageFile,
      ...(data && {
        chatbotConfig: JSON.stringify(data),
      }),
    };

    try {
      const response = await api
        .agents({ uuid: agent.uuid })
        .put(formData as any);
      if (response.data) {
        toast.success("Chatbot konfigürasyonu güncellendi");
        queryClient.invalidateQueries({ queryKey: ["agent"] });
      } else {
        toast.error("Chatbot konfigürasyonu güncellenemedi");
      }
    } catch (error) {
      toast.error("Bir hata oluştu");
      console.error("Chatbot config update error:", error);
    }
  };

  useEffect(() => {
    if (agent) {
      reset({
        ...agent?.chatbotConfig,
      });
    }
  }, [agent, reset]);

  // Cleanup function for preview URL
  useEffect(() => {
    return () => {
      if (selectedFilePreview) {
        URL.revokeObjectURL(selectedFilePreview);
      }
    };
  }, [selectedFilePreview]);

  useEffect(() => {
    if (onConfigChange) {
      const unsubscribe = form.subscribe({
        formState: {
          values: true,
        },
        callback({ values }) {
          onConfigChange?.(
            values as ChatbotConfig & { chatbotImageFile?: File }
          );
        },
      });
      return () => unsubscribe();
    }
    return () => {};
  }, [form, onConfigChange]);

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={cn("grid gap-3", className)}
        {...props}
      >
        <Controller
          name="chatbotName"
          control={control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Chatbot Adı</FormLabel>
              <FormControl>
                <Input
                  placeholder="Chatbot'unuza bir isim verin"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Controller
          name="chatbotImageFile"
          control={control}
          render={({ field: { onChange, value, ...field } }) => (
            <FormItem>
              <FormLabel>Chatbot Görseli</FormLabel>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        onChange(file);

                        // Cleanup previous preview
                        if (selectedFilePreview) {
                          URL.revokeObjectURL(selectedFilePreview);
                        }

                        // Create new preview
                        if (file) {
                          setSelectedFilePreview(URL.createObjectURL(file));
                        } else {
                          setSelectedFilePreview(null);
                        }
                      }}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </div>

                {/* Image Preview */}
                {(selectedFilePreview ||
                  agent?.chatbotConfig?.chatbotImage) && (
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                      <img
                        src={
                          selectedFilePreview ||
                          getAsset(agent?.chatbotConfig?.chatbotImage) ||
                          ""
                        }
                        alt="Chatbot önizleme"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                      {selectedFilePreview ? "Yeni görsel" : "Mevcut görsel"}
                    </p>
                  </div>
                )}
              </div>
            </FormItem>
          )}
        />

        <Controller
          name="widgetPosition"
          control={control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Widget Pozisyonu</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Widget pozisyonunu seçiniz" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="LEFT">Sol</SelectItem>
                  <SelectItem value="LEFT_CENTER">Sol-orta</SelectItem>
                  <SelectItem value="RIGHT_CENTER">Sağ-orta</SelectItem>
                  <SelectItem value="RIGHT">Sağ</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="mt-4 mb-2">
          <h3 className="text-lg font-semibold">Görünüm Ayarları</h3>
        </div>

        <Controller
          name="primaryColor"
          control={control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Birincil Renk</FormLabel>
              <FormControl>
                <ColorPicker
                  value={field.value || "#3B82F6"}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Controller
          name="secondaryColor"
          control={control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>İkincil Renk</FormLabel>
              <FormControl>
                <ColorPicker
                  value={field.value || "#EFF6FF"}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Controller
          name="backgroundColor"
          control={control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Arkaplan Rengi</FormLabel>
              <FormControl>
                <ColorPicker
                  value={field.value || "#FFFFFF"}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Controller
          name="textColor"
          control={control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Metin Rengi</FormLabel>
              <FormControl>
                <ColorPicker
                  value={field.value || "#1F2937"}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Controller
          name="borderRadius"
          control={control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Border Radius</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    placeholder="12"
                    className="w-20"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                  <span className="text-sm text-muted-foreground">px</span>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="mt-2 w-fit ml-auto bg-green-600 hover:bg-green-700 text-white"
        >
          Kaydet
        </Button>
      </form>
    </Form>
  );
}
