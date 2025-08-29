import { CustomChat } from "#components/chat/custom-chat.tsx";
import { Main } from "#components/layout/main.tsx";
import { useAuthEvents } from "#hooks/use-auth-events.ts";
import { cn } from "#lib/utils.ts";
import { useChatAuthStore } from "#stores/chat-auth-store.ts";
import { useChatStore } from "#stores/chat-store.ts";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/chats/")({
  component: Chats,
});

function Chats() {
  const { refreshConversationList } = useChatStore();
  const { userId, isAuthenticated, checkAuthStatus, setUserId } =
    useChatAuthStore();

  useEffect(() => {
    // Sayfa yüklendiğinde auth status kontrol et
    // Thread list component'i zaten mount'ta otomatik conversation'ları fetch ediyor
    checkAuthStatus();
  }, []);

  // Authentication event handler'ını al
  const { handleAuthUpdate } = useAuthEvents({
    onAuthChange: (userId) => {
      // Auth durumu değiştiğinde thread listesini refresh et
      console.log(
        "🔄 Auth değişti, thread list refresh ediliyor, userId:",
        userId
      );
      setUserId(userId); // Store'u güncelle

      // Daha kısa delay ile refresh et
      setTimeout(() => {
        refreshConversationList();
      }, 500);
    },
    onLogin: (userId) => {
      // Login sonrası thread migration'ı beklemek için kısa bir delay
      console.log("✅ Login sonrası migration bekleniyor, userId:", userId);
      setUserId(userId); // Store'u güncelle

      // 2 kere refresh et: hemen bir tane, sonra migration için
      refreshConversationList();
      setTimeout(() => {
        refreshConversationList();
      }, 1500);
    },
    onLogout: () => {
      // Logout sonrası thread listesini temizle
      console.log("❌ Logout sonrası thread list temizleniyor");
      setUserId(undefined); // Store'u temizle

      // Hemen refresh et
      refreshConversationList();
    },
  });

  // handleAuthUpdate fonksiyonunu global olarak erişilebilir yap
  // (diğer component'ler kullanabilsin)
  useEffect(() => {
    // @ts-ignore
    window.handleAuthUpdate = handleAuthUpdate;
    // @ts-ignore
    window.chatAuthStore = { userId, isAuthenticated, setUserId };
    return () => {
      // @ts-ignore
      delete window.handleAuthUpdate;
      // @ts-ignore
      delete window.chatAuthStore;
    };
  }, [handleAuthUpdate, userId, isAuthenticated, setUserId]);

  return (
    <div
      id="content"
      className={cn(
        "ml-auto w-full max-w-full",
        "peer-data-[state=collapsed]:w-[calc(100%-var(--sidebar-width-icon)-1rem)]",
        "peer-data-[state=expanded]:w-[calc(100%-var(--sidebar-width))]",
        "sm:transition-[width] sm:duration-200 sm:ease-linear",
        "flex h-svh flex-col",
        "group-data-[scroll-locked=1]/body:h-full",
        "has-[main.fixed-main]:group-data-[scroll-locked=1]/body:h-svh"
      )}
    >
      <Main fixed>
        <section className="flex h-full">
          <CustomChat />
        </section>
      </Main>
      {/* <div className="grid grid-cols-[320px_1fr] h-screen">
                <ThreadList />
                <Thread />
            </div> */}
    </div>
  );
}
