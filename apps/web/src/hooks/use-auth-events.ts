import { useRef } from 'react';

interface UseAuthEventsOptions {
  onAuthChange?: (userId?: string) => void;
  onLogin?: (userId: string) => void;
  onLogout?: () => void;
}

export function useAuthEvents(options: UseAuthEventsOptions = {}) {
  const { onAuthChange, onLogin, onLogout } = options;
  const previousUserId = useRef<string | null | undefined>(undefined);

  const handleAuthUpdate = (userId?: string) => {
    // İlk çalıştırmada previousUserId undefined ise, şu anki durumu kaydet
    if (previousUserId.current === undefined) {
      previousUserId.current = userId || null;
      return;
    }
    
    // Authentication durumu değişti mi kontrol et
    const wasAuthenticated = !!previousUserId.current;
    const isAuthenticated = !!userId;
    
    if (isAuthenticated !== wasAuthenticated) {
      console.log(`🔄 Auth durumu değişti: ${wasAuthenticated} -> ${isAuthenticated}`, {
        previousUserId: previousUserId.current,
        currentUserId: userId,
      });
      
      if (isAuthenticated && !wasAuthenticated) {
        // Login oldu
        console.log('✅ Login algılandı, userId:', userId);
        onLogin?.(userId!);
      } else if (!isAuthenticated && wasAuthenticated) {
        // Logout oldu
        console.log('❌ Logout algılandı');
        onLogout?.();
      }
      
      // Genel auth change callback'i
      onAuthChange?.(userId);
      
      previousUserId.current = userId || null;
    }
  };

  // Auth update fonksiyonunu return et ki component'ler kullanabilsin
  return { handleAuthUpdate };
} 