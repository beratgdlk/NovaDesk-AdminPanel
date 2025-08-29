import { ChatbotConfigForm } from "#/components/form/chatbot-config-form";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { ChatbotConfig, WidgetPosition } from "#backend/modules/agents/types.ts";
import { ChatbotProvider, ChatbotWindow } from "#components/chatbot";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/$agentId/chatbot/")({
  component: RouteComponent,
});

function RouteComponent() {
  const [previewConfig, setPreviewConfig] = useState<ChatbotConfig & { chatbotImageFile?: File }>({
    chatbotName: "AI Assistant",
    primaryColor: "#3B82F6",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    widgetPosition: WidgetPosition.RIGHT,
    chatbotImageFile: undefined,
  });

  return (
    <div className="container mx-auto p-6 mt-5">
      <h1 className="text-3xl font-bold mb-6">Web Chatbot Ayarları</h1>
      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2 h-fit">
          <CardContent>
            <ChatbotConfigForm onConfigChange={setPreviewConfig} />
          </CardContent>
        </Card>

        <Card className="col-span-1 flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle>Chatbot Live Preview</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-4 relative flex flex-col items-center justify-center">
            <ChatbotProvider initialConfig={previewConfig}>
              <ChatbotWindow isPreviewMode={true} />
            </ChatbotProvider>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
