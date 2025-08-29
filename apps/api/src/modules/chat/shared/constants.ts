export const CHAT_CONSTANTS = {
  // API Config
  INSURUP_API_BASE: 'https://api.insurup.com/api/',
  MCP_URL: process.env.MCP_URL ?? 'http://localhost:3000/mcp',

  // Session
  JWT_SECRET: process.env.JWT_SECRET ?? 'your-secret-key',
  COOKIE_NAME: 'conversation_participant_session',
  SESSION_EXPIRY_DAYS: 30,

  // MCP Config
  MCP_RECONNECT_MAX_ATTEMPTS: 5,
  MCP_RECONNECT_DELAY_MS: 2000,

  // Message Limits
  MESSAGE_MIN_LENGTH: 1,
  MESSAGE_MAX_LENGTH: 10000,
  CONVERSATION_TITLE_MAX_LENGTH: 50,
  CONVERSATION_TITLE_WORDS: 6,
  LAST_MESSAGE_MAX_LENGTH: 500,
  HISTORY_DEFAULT_LIMIT: 20,
  HISTORY_MAX_LIMIT: 100,

  // Validation
  IDENTITY_NUMBER_LENGTH: 11,
  MFA_CODE_LENGTH: 6,
  PHONE_MIN_LENGTH: 10,
  PHONE_MAX_LENGTH: 15,
  PHONE_DEFAULT_COUNTRY_CODE: 90,

  // WebSocket
  WEBSOCKET_INACTIVE_THRESHOLD_MINUTES: 30,
  WEBSOCKET_HEARTBEAT_INTERVAL_MS: 30000,
} as const;

export const CHAT_ERRORS = {
  // Auth Errors
  INVALID_IDENTITY_NUMBER: 'Geçersiz TC kimlik numarası. 11 haneli sayı olmalıdır.',
  PHONE_NUMBER_REQUIRED: 'Telefon numarası gereklidir.',
  LOGIN_TOKEN_REQUIRED: 'Login token gereklidir.',
  INVALID_MFA_CODE: 'Geçersiz MFA kodu. 6 haneli sayı olmalıdır.',
  LOGIN_FAILED: 'Login işlemi başarısız',
  MFA_VERIFICATION_FAILED: 'MFA doğrulama başarısız',
  AUTH_REQUIRED: 'Giriş yapmanız gerekiyor',
  SESSION_EXPIRED: 'Oturumunuz süresi doldu',
  SESSION_CREATION_FAILED: 'Session oluşturulamadı',
  AUTH_STATUS_FAILED: 'Auth status kontrolü başarısız',
  LOGOUT_FAILED: 'Çıkış işlemi başarısız',

  // Chat Errors
  MESSAGE_REQUIRED: 'Mesaj gerekli',
  CONVERSATION_NOT_FOUND: 'Konuşma bulunamadı',
  CONVERSATION_ACCESS_DENIED: 'Bu konuşmaya erişim yetkiniz yok',
  MESSAGE_SEND_FAILED: 'Mesaj gönderilemedi',
  HISTORY_FETCH_FAILED: 'Konuşma geçmişi getirilemedi',
  CONVERSATION_LIST_FAILED: 'Konuşma listesi getirilemedi',
  CONVERSATION_ID_HEADER_REQUIRED: 'x-conversation-id header gerekli',
  PARTICIPANT_CREATION_FAILED: 'Conversation participant oluşturulamadı',
  CONVERSATION_MIGRATION_FAILED: 'Conversation migration başarısız',

  // WebSocket Errors
  WS_NO_SESSION: 'WebSocket bağlantısı için session bulunamadı',
  WS_UNAUTHORIZED: 'WebSocket bağlantısı yetkisiz',
  WS_MESSAGE_PROCESSING_ERROR: 'WebSocket mesajı işlenirken hata',
  WS_UNKNOWN_MESSAGE_TYPE: 'Bilinmeyen WebSocket mesaj tipi',
  WS_INTERNAL_ERROR: 'WebSocket içsel hata',

  // General Errors
  UNKNOWN_ERROR: 'Bilinmeyen hata oluştu',
  VALIDATION_ERROR: 'Doğrulama hatası',
} as const;

export const CHAT_MESSAGES = {
  CHAT_SERVICE_INITIALIZED: 'Chat service initialized successfully',
  CHAT_SERVICE_CLOSED: 'Chat service closed successfully',
  CHAT_SERVICE_INIT_FAILED: 'Failed to initialize chat service:',
  CHAT_SERVICE_CLOSE_FAILED: 'Failed to close chat service:',
  MCP_CLIENT_AUTH_UPDATED: '🔐 MCP Client auth headers güncellendi',
  LOGIN_SUCCESS: 'Giriş başarılı',
  LOGOUT_SUCCESS: 'Başarıyla çıkış yapıldı.',
  MESSAGE_SENT: 'Mesaj gönderildi',
  NEW_CONVERSATION_TITLE: 'Yeni Konuşma',

  // WebSocket Messages
  CONNECTION_ESTABLISHED: 'WebSocket bağlantısı başarıyla kuruldu',
  WS_CONNECTION_CLOSED: 'WebSocket bağlantısı kapatıldı',
  WS_SESSION_CLEANED: 'WebSocket session temizlendi',
  WS_HEARTBEAT_STARTED: 'WebSocket heartbeat başlatıldı',
  WS_HEARTBEAT_STOPPED: 'WebSocket heartbeat durduruldu',
  WS_HEARTBEAT_PING_SENT: 'WebSocket heartbeat ping gönderildi',
  WS_HEARTBEAT_PONG_RECEIVED: 'WebSocket heartbeat pong alındı',
} as const;
