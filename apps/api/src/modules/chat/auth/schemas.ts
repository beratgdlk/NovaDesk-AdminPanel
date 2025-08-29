import { t } from 'elysia';
import { CHAT_CONSTANTS } from '../shared/constants';

// Auth request schemas
export const loginBodySchema = t.Object({
  identityNumber: t.String({
    minLength: CHAT_CONSTANTS.IDENTITY_NUMBER_LENGTH,
    maxLength: CHAT_CONSTANTS.IDENTITY_NUMBER_LENGTH,
    pattern: '^[0-9]{11}$',
    description: 'TC kimlik numarası (11 haneli)',
  }),
  phoneCountryCode: t.Optional(
    t.Number({
      minimum: 1,
      maximum: 999,
      default: CHAT_CONSTANTS.PHONE_DEFAULT_COUNTRY_CODE,
      description: 'Telefon ülke kodu (varsayılan: 90)',
    }),
  ),
  phoneNumber: t.String({
    minLength: CHAT_CONSTANTS.PHONE_MIN_LENGTH,
    maxLength: CHAT_CONSTANTS.PHONE_MAX_LENGTH,
    description: 'Telefon numarası',
  }),
  birthDate: t.Optional(
    t.String({
      pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}$',
      description: 'Doğum tarihi (YYYY-MM-DD formatında)',
    }),
  ),
});

export const mfaVerificationBodySchema = t.Object({
  loginToken: t.String({
    description: 'Login işleminden dönen token',
  }),
  mfaCode: t.String({
    minLength: CHAT_CONSTANTS.MFA_CODE_LENGTH,
    maxLength: CHAT_CONSTANTS.MFA_CODE_LENGTH,
    pattern: '^[0-9]{6}$',
    description: 'Telefona gelen 6 haneli MFA kodu',
  }),
});

// Auth header schemas
export const authHeadersSchema = t.Object({
  Authorization: t.Optional(
    t.String({
      description: 'Bearer token for conversation session',
    }),
  ),
});

// Auth response schemas
export const loginResponseSchema = t.Object({
  success: t.Boolean({
    description: 'İşlem başarılı mı',
  }),
  message: t.String({
    description: 'İşlem sonucu mesajı',
  }),
  loginToken: t.Optional(
    t.String({
      description: 'MFA doğrulama için gerekli token',
    }),
  ),
  mfaRequired: t.Optional(
    t.Boolean({
      description: 'MFA doğrulama gerekli mi',
    }),
  ),
});

export const mfaVerificationResponseSchema = t.Object({
  success: t.Boolean({
    description: 'MFA doğrulama başarılı mı',
  }),
  message: t.String({
    description: 'İşlem sonucu mesajı',
  }),
  authenticated: t.Optional(
    t.Boolean({
      description: 'Kullanıcı tamamen giriş yaptı mı',
    }),
  ),
});

export const authStatusResponseSchema = t.Object({
  isAuthenticated: t.Boolean({
    description: 'Kullanıcı giriş yapmış mı',
  }),
  userId: t.Optional(
    t.String({
      description: 'Kullanıcı ID (authenticated ise döner)',
    }),
  ),
  expiryMinutes: t.Optional(
    t.Number({
      description: 'Token süresinin dolmasına kaç dakika kaldı',
    }),
  ),
  shouldRefresh: t.Optional(
    t.Boolean({
      description: 'Token yenilenmeli mi',
    }),
  ),
});

export const logoutResponseSchema = t.Object({
  success: t.Boolean({
    description: 'Çıkış işlemi başarılı mı',
  }),
  message: t.String({
    description: 'İşlem sonucu mesajı',
  }),
  newSessionId: t.String({
    description: 'Yeni oluşturulan session ID',
  }),
}); 