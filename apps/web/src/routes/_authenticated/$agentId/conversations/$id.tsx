import { Main } from "#/components/layout/main";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { api } from "#lib/api.ts";
import { formatDate } from "#lib/utils.ts";
import { IconMessage } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

// Backend conversation types
interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  toolCalls?: any[];
  toolResults?: any[];
}

interface ConversationHistory {
  conversationId: string;
  messages: ConversationMessage[];
  totalMessages: number;
  hasMore: boolean;
}

export const Route = createFileRoute(
  "/_authenticated/$agentId/conversations/$id"
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { agentId, id: conversationId } = Route.useParams();

  const {
    data: conversationResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["conversation", conversationId, agentId],
    queryFn: () =>
      api.chat.history.get({
        headers: {
          "x-conversation-id": conversationId,
        },
        query: {},
      }),
  });

  const conversationHistory: ConversationHistory =
    conversationResponse?.data ?? {
      conversationId: "",
      messages: [],
      totalMessages: 0,
      hasMore: false,
    };

  // Derive information from messages
  const firstMessage = conversationHistory.messages[0];
  const lastMessage =
    conversationHistory.messages[conversationHistory.messages.length - 1];

  const title = firstMessage
    ? `${firstMessage.content.substring(0, 50)}${firstMessage.content.length > 50 ? "..." : ""}`
    : "Yeni Konuşma";

  const lastMessageContent = lastMessage
    ? `${lastMessage.content.substring(0, 100)}${lastMessage.content.length > 100 ? "..." : ""}`
    : "Henüz mesaj yok";

  const createdAt = firstMessage?.timestamp || new Date().toISOString();
  const updatedAt = lastMessage?.timestamp || new Date().toISOString();

  if (isLoading) {
    return (
      <Main>
        <div className="container mx-auto">
          <div className="space-y-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Konuşma yükleniyor...</p>
            </div>
          </div>
        </div>
      </Main>
    );
  }

  if (error) {
    return (
      <Main>
        <div className="container mx-auto">
          <div className="space-y-6">
            <div className="text-center py-8">
              <p className="text-red-600">Konuşma yüklenirken hata oluştu.</p>
            </div>
          </div>
        </div>
      </Main>
    );
  }

  return (
    <Main>
      <div className="container mx-auto">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">
                Konuşma Detayları
              </h2>
              <p className="text-muted-foreground">
                Konuşma ID: {conversationId}
              </p>
            </div>
          </div>

          {/* Conversation Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconMessage className="h-5 w-5" />
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Messages Display */}
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {conversationHistory.messages.length > 0 ? (
                        conversationHistory.messages.map((message, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg ${
                              message.role === "user"
                                ? "bg-blue-50 border-r-4 border-blue-400"
                                : "bg-gray-50 border-l-4 border-gray-400"
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-medium text-muted-foreground uppercase">
                                {message.role === "user"
                                  ? "Kullanıcı"
                                  : "Asistan"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(
                                  message.timestamp,
                                  "dd.MM.yyyy HH:mm"
                                )}
                              </span>
                            </div>
                            <p
                              className={`text-sm  ${
                                message.role === "user"
                                  ? "text-right"
                                  : "text-left"
                              }`}
                            >
                              {message.content}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">
                            Bu konuşmada henüz mesaj bulunmuyor.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Konuşma Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Durum
                    </p>
                    <p className="text-sm">
                      {conversationHistory.messages.length > 0
                        ? "Aktif"
                        : "Boş"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Mesaj Sayısı
                    </p>
                    <p className="text-sm">
                      {conversationHistory.totalMessages} mesaj
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Oluşturulma Tarihi
                    </p>
                    <p className="text-sm">
                      {formatDate(createdAt, "dd.MM.yyyy HH:mm")}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Son Güncellenme
                    </p>
                    <p className="text-sm">
                      {formatDate(updatedAt, "dd.MM.yyyy HH:mm")}
                    </p>
                  </div>

                  {conversationHistory.hasMore && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Daha Fazla Mesaj
                      </p>
                      <p className="text-sm text-blue-600">
                        Daha fazla mesaj mevcut
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Main>
  );
}
