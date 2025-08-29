import { create } from 'zustand';
import { api } from '#lib/api';

interface ChatAuthState {
  userId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  lastChecked: number;
  setUserId: (userId?: string) => void;
  checkAuthStatus: () => Promise<void>;
  reset: () => void;
}

export const useChatAuthStore = create<ChatAuthState>()((set, get) => ({
  userId: null,
  isAuthenticated: false,
  isLoading: false,
  lastChecked: 0,

  setUserId: (userId?: string) => {
    const newAuthState = !!userId;
    const currentState = get();

    // Auth durumu değişti mi kontrol et
    if (currentState.isAuthenticated !== newAuthState) {
      // Auth durumu değiştiğinde yapılacak işlemler
    }

    set({
      userId: userId || null,
      isAuthenticated: newAuthState,
      lastChecked: Date.now(),
    });
  },

  checkAuthStatus: async () => {
    const currentState = get();

    // Çok sık çağrılmasını engelle (5 saniye cache)
    if (currentState.isLoading || Date.now() - currentState.lastChecked < 5000) {
      return;
    }

    set({ isLoading: true });

    try {
      // @ts-ignore
      const response = await api.chat.auth.status.get();
      const data = response?.data;

      console.log('📡 Auth status response:', data);

      // Backend'den direkt userId'yi alıyoruz
      get().setUserId(data?.userId);
    } catch (error) {
      console.error('Chat auth status kontrolü başarısız:', error);
      // Hata durumunda mevcut state'i koru
    } finally {
      set({ isLoading: false });
    }
  },

  reset: () => {
    set({
      userId: null,
      isAuthenticated: false,
      isLoading: false,
      lastChecked: 0,
    });
  },
}));
