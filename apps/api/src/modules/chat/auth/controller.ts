import { Elysia } from 'elysia';
import { AgentsService } from '#modules/agents/service.ts';
import { BadRequestException, InternalServerErrorException } from '#utils/http-errors.ts';
import { dtoWithMiddlewares } from '../../../utils';
import { CHAT_CONSTANTS, CHAT_ERRORS } from '../shared/constants';
import { authStatusDto, loginDto, logoutDto, mfaVerificationDto } from './dtos';
import { AuthService } from './service';

export const authController = new Elysia({ prefix: '/auth' })
  .post(
    '/login',
    async ({ body, request, cookie: { chatSessionId } }) => {
      try {
        const agent = await AgentsService.showByDomain(request);
        const sessionId = await AuthService.createAnonymousSession(agent);

        // Cookie'yi set et
        chatSessionId!.set({
          value: sessionId,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: CHAT_CONSTANTS.SESSION_EXPIRY_DAYS * 24 * 60 * 60, // Convert days to seconds
        });

        // Login işlemini başlat
        const loginResponse = await AuthService.login({
          ...body,
          phoneCountryCode: body.phoneCountryCode || CHAT_CONSTANTS.PHONE_DEFAULT_COUNTRY_CODE,
        });

        return {
          success: true,
          message: loginResponse.message,
          loginToken: loginResponse.loginToken || loginResponse.token,
          mfaRequired: loginResponse.mfaRequired,
        };
      } catch (error) {
        console.error('Login controller error:', error);
        throw new InternalServerErrorException(
          error instanceof Error ? error.message : CHAT_ERRORS.LOGIN_FAILED,
        );
      }
    },
    dtoWithMiddlewares(loginDto),
  )

  .post(
    '/verify-mfa',
    async ({ body, cookie: { chatSessionId } }) => {
      const sessionId = chatSessionId?.value;
      if (!sessionId) {
        throw new BadRequestException('Session not found');
      }

      try {
        const mfaResponse = await AuthService.verifyMfa(body, sessionId);

        return {
          success: mfaResponse.success,
          message: mfaResponse.message,
          authenticated: mfaResponse.authenticated,
        };
      } catch (error) {
        console.error('MFA verification controller error:', error);
        throw new InternalServerErrorException(
          error instanceof Error ? error.message : CHAT_ERRORS.MFA_VERIFICATION_FAILED,
        );
      }
    },
    dtoWithMiddlewares(mfaVerificationDto),
  )

  .get(
    '/status',
    async ({ cookie: { chatSessionId } }) => {
      const sessionId = chatSessionId?.value;
      if (!sessionId) {
        return { isAuthenticated: false };
      }

      try {
        const authStatus = await AuthService.getAuthStatus(sessionId);
        return authStatus;
      } catch (error) {
        console.error('Auth status controller error:', error);
        throw new InternalServerErrorException(CHAT_ERRORS.AUTH_STATUS_FAILED);
      }
    },
    dtoWithMiddlewares(authStatusDto),
  )

  .post(
    '/logout',
    async ({ cookie: { chatSessionId } }) => {
      const sessionId = chatSessionId?.value;
      if (!sessionId) {
        throw new BadRequestException('Session not found');
      }

      try {
        // Logout yapıp yeni session al (createNewSession: true - default)
        const newSessionId = (await AuthService.logout(sessionId, true)) as string;

        // Eski cookie'yi temizle
        chatSessionId?.remove();

        console.log(`🔓 Eski session cookie temizlendi: ${sessionId}`);
        console.log(`🆕 Yeni session oluşturuldu: ${newSessionId}`);

        return {
          success: true,
          message: 'Çıkış işlemi başarılı',
          newSessionId: newSessionId,
        };
      } catch (error) {
        console.error('Logout controller error:', error);
        throw new InternalServerErrorException(CHAT_ERRORS.LOGOUT_FAILED);
      }
    },
    dtoWithMiddlewares(logoutDto),
  )

  .post(
    '/refresh',
    async ({ cookie: { chatSessionId } }) => {
      const sessionId = chatSessionId?.value;
      if (!sessionId) {
        throw new BadRequestException('Session not found');
      }

      try {
        const refreshSuccess = await AuthService.refreshAccessToken(sessionId);

        if (!refreshSuccess) {
          throw new BadRequestException('Token refresh failed');
        }

        const authStatus = await AuthService.getAuthStatus(sessionId);

        return {
          success: true,
          message: 'Token refreshed successfully',
          isAuthenticated: authStatus.isAuthenticated,
          expiryMinutes: authStatus.expiryMinutes,
        };
      } catch (error) {
        console.error('Token refresh controller error:', error);
        throw new InternalServerErrorException(
          error instanceof Error ? error.message : 'Token refresh failed',
        );
      }
    },
    dtoWithMiddlewares(authStatusDto),
  )

  .get('/token-debug', async ({ cookie: { chatSessionId } }) => {
    const sessionId = chatSessionId?.value;
    if (!sessionId) {
      return { error: 'No session found' };
    }

    try {
      const session = await AuthService.getSession(sessionId);

      if (!session) {
        return { error: 'Session not found in database' };
      }

      const shouldRefresh = AuthService.shouldRefreshToken(session);
      const authStatus = await AuthService.getAuthStatus(sessionId);

      const accessTokenExpiry = session.accessTokenExpiresAt || session.expiresAt;
      const refreshTokenExpiry = session.refreshTokenExpiresAt;

      const accessTokenMinutes = session.accessToken
        ? Math.floor((accessTokenExpiry.getTime() - Date.now()) / (1000 * 60))
        : null;

      const refreshTokenMinutes = refreshTokenExpiry
        ? Math.floor((refreshTokenExpiry.getTime() - Date.now()) / (1000 * 60))
        : null;

      return {
        sessionId: sessionId,
        hasAccessToken: !!session.accessToken,
        hasRefreshToken: !!session.refreshToken,
        accessTokenExpiresIn: accessTokenMinutes,
        refreshTokenExpiresIn: refreshTokenMinutes,
        shouldRefresh,
        isAuthenticated: authStatus.isAuthenticated,
        userId: session.userId,
      };
    } catch (error) {
      console.error('Token debug error:', error);
      return { error: 'Debug check failed' };
    }
  });
