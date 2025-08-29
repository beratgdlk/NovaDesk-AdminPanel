import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { api } from '#lib/api';

// Notification sound utility function
const playNotificationSound = () => {
  try {
    // Simple notification beep using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800; // Hz
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.warn('Notification sound could not be played:', error);
  }
};

export interface SyncableMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  id?: string;
  createdAt?: Date;
  isStreaming?: boolean;
  streamingComplete?: boolean;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: any;
    type: string;
    status?: string;
    hasArguments?: boolean;
    error?: string;
  }>;
  toolResults?: Array<{
    id: string;
    name: string;
    result: any;
    status: string;
    arguments?: any;
    error?: string;
  }>;
  isHidden?: boolean;
}

interface UsePeriodicMessageSyncOptions {
  conversationId: string | null;
  currentMessages: SyncableMessage[];
  onNewMessages: (newMessages: SyncableMessage[]) => void;
  isStreaming?: boolean;
  intervalMs?: number;
}

export function usePeriodicMessageSync({
  conversationId,
  currentMessages,
  onNewMessages,
  isStreaming = false,
  intervalMs = 10000, // 10 saniye
}: UsePeriodicMessageSyncOptions) {
  return; /* 
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncTimeRef = useRef<number>(0);
  const isFirstSyncRef = useRef<boolean>(true);
  const currentMessagesRef = useRef<SyncableMessage[]>(currentMessages);
  const onNewMessagesRef = useRef(onNewMessages);

  // Ref'leri güncel tut
  useEffect(() => {
    currentMessagesRef.current = currentMessages;
    onNewMessagesRef.current = onNewMessages;
  }, [currentMessages, onNewMessages]);

  // Ortak sync fonksiyonu
  const performSync = useCallback(
    async (isManual: boolean = false) => {
      if (!conversationId || isStreaming) {
        return;
      }

      try {
        const response = (await (api as any).chat.history.get({
          query: {},
          headers: {
            'x-conversation-id': conversationId,
          },
        })) as { data: ConversationHistoryResponse };

        if (!response.data) {
          return;
        }

        const serverMessages = response.data.messages
          .filter((msg: any) => !msg.isHidden)
          .map((msg: any) => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            id: msg.timestamp,
            createdAt: new Date(msg.timestamp),
            isStreaming: false,
            streamingComplete: true,
            toolCalls: msg.toolCalls || [],
            toolResults: msg.toolResults || [],
            isHidden: msg.isHidden,
          }));

        // İlk sync'te tüm mesajları almakla ilgilenme, sadece yeni mesajları kontrol et
        if (isFirstSyncRef.current && !isManual) {
          isFirstSyncRef.current = false;
          lastSyncTimeRef.current = Date.now();
          return;
        }

        // Diff logic: güncel mesajları ref'ten al
        const currentMessageIds = new Set(
          currentMessagesRef.current.map((msg) => msg.id || msg.timestamp),
        );
        const newMessages = serverMessages.filter((serverMsg: any) => {
          const msgId = serverMsg.id || serverMsg.timestamp;
          return !currentMessageIds.has(msgId);
        });

        // Yeni mesajlar varsa callback'i çağır
        if (newMessages.length > 0) {
          console.log(
            `🔄 ${isManual ? 'Manuel' : 'Otomatik'} sync: ${newMessages.length} yeni mesaj bulundu, inject ediliyor...`,
          );

          // Toast notification göster
          const messageText =
            newMessages.length === 1
              ? 'Yeni mesaj geldi'
              : `${newMessages.length} yeni mesaj geldi`;

          toast.info(messageText, {
            duration: 3000,
            position: 'top-right',
          });

          // Notification sound çal
          playNotificationSound();

          onNewMessagesRef.current(newMessages);
        }

        lastSyncTimeRef.current = Date.now();
      } catch (error) {
        console.error('Mesaj sync hatası:', error);
      }
    },
    [conversationId, isStreaming],
  );

  const syncMessages = useCallback(async () => {
    await performSync(false);
  }, [performSync]);

  // Interval'i başlat/durdur
  useEffect(() => {
    if (conversationId && !isStreaming) {
      // İlk sync'i hemen yap
      syncMessages();

      // Interval'i kur
      intervalRef.current = setInterval(syncMessages, intervalMs);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else {
      // Streaming aktifken veya conversation seçili değilken interval'i durdur
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [conversationId, isStreaming, intervalMs]); // syncMessages dependency'sini kaldırdık

  // Component unmount olduğunda interval'i temizle
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Manuel sync fonksiyonu
  const manualSync = useCallback(async () => {
    await performSync(true);
  }, [performSync]);

  return {
    manualSync,
    isPeriodicSyncActive: !!intervalRef.current,
  }; */
}
