import { createUIMessageStreamResponse } from 'ai';
import { Elysia } from 'elysia';
import { AgentsService } from '#modules/agents/service.ts';
import {
  BadRequestException,
  HttpError,
  InternalServerErrorException,
} from '#utils/http-errors.ts';
import { dtoWithMiddlewares } from '../../../utils';
import { AuthService } from '../auth/service';
import { CHAT_CONSTANTS, CHAT_ERRORS } from '../shared/constants';
import { handleSessionRecovery } from '../shared/utils/session';
import { chatMessageDto, conversationHistoryDto, conversationListDto } from './dtos';
import { ChatService } from './service';

export const conversationController = new Elysia()
  .post(
    '/message',
    async ({ body, request, cookie: { chatSessionId } }) => {
      const message = body.message;

      if (!message) {
        throw new BadRequestException(CHAT_ERRORS.MESSAGE_REQUIRED);
      }

      // Session ID'yi al
      let sessionId = chatSessionId?.value || '';

      try {
        // Header'dan conversationId ve selectedModel'i al
        const conversationId = request.headers.get('x-conversation-id');
        const selectedModel = request.headers.get('x-selected-model');

        // Yeni conversation ise session recovery yap
        const isNewConversation = !conversationId;
        let sessionRecovered = false;
        const oldSessionId = sessionId;

        if (isNewConversation) {
          const agent = await AgentsService.showByDomain(request);
          const sessionRecovery = await handleSessionRecovery(sessionId, agent);

          if (sessionRecovery.isRecovered) {
            // Cookie'yi güncelle
            chatSessionId!.set({
              value: sessionRecovery.sessionId,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
              maxAge: CHAT_CONSTANTS.SESSION_EXPIRY_DAYS * 24 * 60 * 60,
            });
            console.log(
              `🔄 Pre-sync session recovery: Cookie updated from ${sessionId} to ${sessionRecovery.sessionId}`,
            );
            sessionId = sessionRecovery.sessionId;
            sessionRecovered = true;
          }
        }

        // Request oluştur
        const data = {
          message: message ?? '',
          conversationId,
          selectedModel,
        };

        const chatResponse = await ChatService.sendMessageSync(
          data,
          sessionId,
          new URL(request.url).hostname,
        );

        // Session recovery yapıldıysa response'a ekle
        if (sessionRecovered) {
          chatResponse.newSessionId = sessionId;
          chatResponse.sessionUpdated = true;
        }

        // Artık ChatService'de session recovery yapılmıyor, ama yine de kontrol edelim
        if (chatResponse.newSessionId && chatResponse.sessionUpdated) {
          // Cookie zaten güncellenmiş olmalı, ama log'u yine de bırakalım
          console.log(
            `🔄 Session was recovered: Old=${oldSessionId}, New=${chatResponse.newSessionId}`,
          );
        }

        return chatResponse;
      } catch (error) {
        console.error('Message controller error:', error);

        if (error instanceof HttpError) {
          throw error;
        }

        throw new InternalServerErrorException(CHAT_ERRORS.MESSAGE_SEND_FAILED);
      }
    },
    chatMessageDto,
  )

  .post(
    '/message/stream',
    async function ({ body, request, cookie: { chatSessionId }, set }) {
      const message = body.message;

      if (!message) {
        throw new BadRequestException(CHAT_ERRORS.MESSAGE_REQUIRED);
      }

      // Session ID'yi al
      let sessionId = chatSessionId?.value || '';

      try {
        // Header'dan conversationId ve selectedModel'i al
        const conversationId = request.headers.get('x-conversation-id');
        const selectedModel = request.headers.get('x-selected-model');

        // Yeni conversation ise streaming başlamadan önce session recovery yap
        const isNewConversation = !conversationId;

        if (isNewConversation) {
          const agent = await AgentsService.showByDomain(request);
          const sessionRecovery = await handleSessionRecovery(sessionId, agent);

          if (sessionRecovery.isRecovered) {
            // Cookie'yi güncelle (streaming başlamadan önce)
            chatSessionId!.set({
              value: sessionRecovery.sessionId,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
              maxAge: CHAT_CONSTANTS.SESSION_EXPIRY_DAYS * 24 * 60 * 60,
            });

            console.log(
              `🔄 Pre-stream session recovery: Cookie updated from ${sessionId} to ${sessionRecovery.sessionId}`,
            );
            sessionId = sessionRecovery.sessionId;
          }
        }

        // Request oluştur
        const data = {
          message,
          conversationId,
          selectedModel,
        };

        // ChatService'den stream al - artık session recovery burda yapılmasın
        const stream = await ChatService.sendMessage(
          data,
          sessionId,
          new URL(request.url).hostname,
        );

        return createUIMessageStreamResponse({
          stream,
        });
      } catch (error) {
        console.error('Message stream controller error:', error);

        throw error;
      }
    },
    {
      body: chatMessageDto.body,
      headers: chatMessageDto.headers,
    },
  )

  .get(
    '/history',
    async ({ query, request, cookie: { chatSessionId } }) => {
      // Session ID'yi al
      let sessionId = chatSessionId?.value || '';

      // Header'dan conversationId'yi al
      const conversationId = request.headers.get('x-conversation-id');

      if (!conversationId) {
        throw new BadRequestException(CHAT_ERRORS.CONVERSATION_ID_HEADER_REQUIRED);
      }

      // Session yoksa yeni anonymous session oluştur
      const agent = await AgentsService.showByDomain(request);
      if (!sessionId) {
        sessionId = await AuthService.createAnonymousSession(agent);

        // Cookie'yi set et
        chatSessionId!.set({
          value: sessionId,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: CHAT_CONSTANTS.SESSION_EXPIRY_DAYS * 24 * 60 * 60,
        });

        console.log(`🔄 No session found for history, created new anonymous session: ${sessionId}`);
      } else {
        // Session recovery yap
        const sessionRecovery = await handleSessionRecovery(sessionId, agent);

        if (sessionRecovery.isRecovered) {
          // Cookie'yi güncelle
          chatSessionId!.set({
            value: sessionRecovery.sessionId,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: CHAT_CONSTANTS.SESSION_EXPIRY_DAYS * 24 * 60 * 60,
          });
          console.log(
            `🔄 History session recovery: Cookie updated from ${sessionId} to ${sessionRecovery.sessionId}`,
          );
          sessionId = sessionRecovery.sessionId;
        }
      }

      console.log(
        `🔍 History endpoint called for conversationId: ${conversationId}, sessionId: ${sessionId}`,
      );

      try {
        const history = await ChatService.getConversationHistory(
          conversationId,
          sessionId,
          query.limit,
        );

        return history;
      } catch (error) {
        console.error('History controller error:', error);
        throw new InternalServerErrorException(CHAT_ERRORS.HISTORY_FETCH_FAILED);
      }
    },
    dtoWithMiddlewares(conversationHistoryDto),
  )

  .get(
    '/conversations',
    async ({ request, cookie: { chatSessionId } }) => {
      // Session ID'yi al
      let sessionId = chatSessionId?.value || '';

      // Session yoksa yeni anonymous session oluştur
      if (!sessionId) {
        const agent = await AgentsService.showByDomain(request);
        sessionId = await AuthService.createAnonymousSession(agent);

        // Cookie'yi set et
        chatSessionId!.set({
          value: sessionId,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: CHAT_CONSTANTS.SESSION_EXPIRY_DAYS * 24 * 60 * 60,
        });

        console.log(`🔄 No session found, created new anonymous session: ${sessionId}`);
      } else {
        // Session recovery yap
        const agent = await AgentsService.showByDomain(request);
        const sessionRecovery = await handleSessionRecovery(sessionId, agent);

        if (sessionRecovery.isRecovered) {
          // Cookie'yi güncelle
          chatSessionId!.set({
            value: sessionRecovery.sessionId,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: CHAT_CONSTANTS.SESSION_EXPIRY_DAYS * 24 * 60 * 60,
          });
          console.log(
            `🔄 Conversations session recovery: Cookie updated from ${sessionId} to ${sessionRecovery.sessionId}`,
          );
          sessionId = sessionRecovery.sessionId;
        }
      }

      try {
        const conversations = await ChatService.getConversationList(sessionId);
        return conversations;
      } catch (error) {
        console.error('Conversations controller error:', error);
        throw new InternalServerErrorException(CHAT_ERRORS.CONVERSATION_LIST_FAILED);
      }
    },
    dtoWithMiddlewares(conversationListDto),
  );
