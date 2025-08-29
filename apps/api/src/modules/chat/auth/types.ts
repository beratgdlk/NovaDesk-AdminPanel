// Auth Types
export interface LoginRequest {
  identityNumber: string;
  phoneNumber: string;
  phoneCountryCode: number;
  birthDate?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  loginToken?: string;
  mfaRequired: boolean;
}

export interface MfaRequest {
  loginToken: string;
  mfaCode: string;
}

// Auth tool'ları için alias
export type MfaVerificationRequest = MfaRequest;

// Yeni merkezi type tanımları (auth ile ilgili)
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  tokens?: AuthTokens;
  userData?: AuthUserData;
}

export interface SessionContext {
  sessionId: string;
  userId?: string;
  isAuthenticated: boolean;
  tokens?: AuthTokens;
  userData?: AuthUserData | null;
}

export interface MfaResponse {
  success: boolean;
  message: string;
  authenticated: boolean;
  tokens?: AuthTokens;
  userData?: AuthUserData | null;
}

export interface AuthStatus {
  isAuthenticated: boolean;
  userId?: string;
  sessionId?: string;
  expiryMinutes?: number;
  mfaRequired?: boolean;
  tokensExpired?: boolean;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}
