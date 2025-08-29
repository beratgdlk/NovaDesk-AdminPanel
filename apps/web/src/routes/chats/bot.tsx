import { ChatbotButton } from "#components/chatbot/chatbot-button.tsx";
import { ChatbotProvider } from "#components/chatbot/chatbot-context.tsx";
import { ChatbotWindow } from "#components/chatbot/chatbot-window.tsx";
import { api } from "#lib/api.ts";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/chats/bot")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: response } = useQuery({
    queryKey: ["chatbot-config"],
    queryFn: () =>
      api.agents({ uuid: "54c02cf8-b5bf-45b3-b14e-62604717bf6e" }).get(),
  });
  if (!response?.data) return null;
  const config = response.data.chatbotConfig;
  return (
    <ChatbotProvider initialConfig={config}>
      <ChatbotButton />
      <ChatbotWindow />
    </ChatbotProvider>
  );
}
