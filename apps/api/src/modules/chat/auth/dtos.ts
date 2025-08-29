import { errorResponseDto } from '../../../utils/common-dtos';
import { type ControllerHook } from '../../../utils/elysia-types';
import {
  loginBodySchema,
  mfaVerificationBodySchema,
  loginResponseSchema,
  mfaVerificationResponseSchema,
  authStatusResponseSchema,
  logoutResponseSchema,
} from './schemas';

// ============================================================================
// Auth DTOs
// ============================================================================

export const loginDto = {
  body: loginBodySchema,
  response: {
    200: loginResponseSchema,
    400: errorResponseDto[400],
    500: errorResponseDto[500],
  },
  detail: {
    summary: 'InsurUp giriş yap',
    description:
      'TC kimlik numarası ve telefon numarası ile giriş yapar. MFA kodu telefonuna gönderilir.',
    tags: ['Authentication'],
  },
} satisfies ControllerHook;

export const mfaVerificationDto = {
  body: mfaVerificationBodySchema,
  response: {
    200: mfaVerificationResponseSchema,
    400: errorResponseDto[400],
    500: errorResponseDto[500],
  },
  detail: {
    summary: 'MFA kodunu doğrula',
    description: 'Login işleminden sonra telefonuna gelen MFA kodunu doğrular.',
    tags: ['Authentication'],
  },
} satisfies ControllerHook;

export const authStatusDto = {
  response: {
    200: authStatusResponseSchema,
    500: errorResponseDto[500],
  },
  detail: {
    summary: 'Giriş durumunu kontrol et',
    description: 'Kullanıcının giriş durumunu ve token bilgilerini döner.',
    tags: ['Authentication'],
  },
} satisfies ControllerHook;

export const logoutDto = {
  response: {
    200: logoutResponseSchema,
    500: errorResponseDto[500],
  },
  detail: {
    summary: 'Çıkış yap',
    description: "Kullanıcıyı sistemden çıkarır ve token'ları temizler.",
    tags: ['Authentication'],
  },
} satisfies ControllerHook;
