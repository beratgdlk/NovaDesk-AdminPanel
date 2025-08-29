declare global {
  interface Window {
    handleAuthUpdate?: (userId?: string) => void;
    chatAuthStore?: {
      userId: string | null;
      isAuthenticated: boolean;
      setUserId: (userId?: string) => void;
    };
  }
}

export {}; 