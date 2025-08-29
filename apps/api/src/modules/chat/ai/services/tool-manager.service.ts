import type { StructuredToolInterface, ToolRunnableConfig } from '@langchain/core/tools';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { AuthService } from '../../auth/service';
import type { ExecutionArgument } from '../../conversation/types';
import { CHAT_CONSTANTS, CHAT_ERRORS } from '../../shared/constants';

// Tool Middleware System Types and Interfaces
interface ToolMiddlewareContext {
  sessionId: string;
  conversationId?: string;
  toolName: string;
  arguments: Record<string, unknown>;
  timestamp: number;
}

export interface ToolMiddleware {
  before?: (context: ToolMiddlewareContext) => Promise<void>;
  after?: (context: ToolMiddlewareContext, result: unknown) => Promise<void>;
  formatResponse?: (context: Partial<ToolMiddlewareContext>, result: unknown) => Promise<unknown>;
  error?: (context: ToolMiddlewareContext, error: Error) => Promise<void>;
}

/**
 * Tool management, middleware system ve universal wrapper yönetimi
 */
export class ToolManager {
  // Tool middleware registry - tool name'e göre middleware'leri saklar
  private static toolMiddlewareRegistry = new Map<string, ToolMiddleware[]>();

  // Real-time argument streaming için Map - tool execution sırasında arguments'ları saklar
  private static executionArguments = new Map<string, ExecutionArgument>();

  /**
   * Tool middleware'ini kaydeder
   */
  static registerToolMiddleware(toolName: string, middleware: ToolMiddleware): void {
    if (!this.toolMiddlewareRegistry.has(toolName)) {
      this.toolMiddlewareRegistry.set(toolName, []);
    }
    this.toolMiddlewareRegistry.get(toolName)!.push(middleware);
    console.log(`🔧 Middleware registered for tool: ${toolName}`);
  }

  /**
   * Middleware hook'larını çalıştırır
   */
  static async executeMiddlewareHooks(
    hookType: 'before' | 'after' | 'formatResponse' | 'error',
    context: ToolMiddlewareContext,
    data?: unknown,
  ): Promise<unknown> {
    const middlewares = this.toolMiddlewareRegistry.get(context.toolName) || [];
    let currentData = data;

    for (const middleware of middlewares) {
      try {
        if (hookType === 'before' && middleware.before) {
          await middleware.before(context);
        } else if (hookType === 'after' && middleware.after) {
          await middleware.after(context, currentData);
        } else if (hookType === 'formatResponse' && middleware.formatResponse) {
          const transformedResult = await middleware.formatResponse(context, currentData);
          // FormatResponse hook result döndürürse, onu kullan
          if (transformedResult !== undefined) {
            currentData = transformedResult;
          }
        } else if (hookType === 'error' && middleware.error) {
          await middleware.error(context, data as Error);
        }
      } catch (middlewareError) {
        console.error(
          `❌ Middleware ${hookType} hook failed for tool ${context.toolName}:`,
          middlewareError,
        );
        // Middleware hataları ana tool execution'ını durdurmaz
      }
    }

    return currentData;
  }

  /**
   * Universal tool wrapper - hem MCP hem authentication tool'ları handle eder
   */
  static createUniversalToolWithArgumentCapture<T extends StructuredToolInterface>(
    originalTool: T,
    sessionId: string,
    conversationId?: string,
  ): T {
    // Tool invoke method'u var mı kontrol et
    if (originalTool.invoke && typeof originalTool.invoke === 'function') {
      const originalInvoke = originalTool.invoke.bind(originalTool);

      return {
        ...originalTool,
        invoke: async (input: unknown, config?: ToolRunnableConfig) => {
          const executionKey = `${sessionId}-${originalTool.name}`;

          try {
            // Arguments'ları prepare et ve Map'e kaydet
            let argsForCapture: Record<string, unknown> = {};

            // Eğer input string ise (authentication tool'lar için) JSON parse et
            if (typeof input === 'string' && input.trim() && input !== '{}') {
              try {
                const parsedInput = JSON.parse(input);
                // Nested input kontrolü
                if (parsedInput.input && typeof parsedInput.input === 'object') {
                  argsForCapture = parsedInput.input as Record<string, unknown>;
                } else {
                  argsForCapture = parsedInput as Record<string, unknown>;
                }
              } catch (parseError) {
                // Parse edilemeyen input'ları olduğu gibi bırak
                argsForCapture = { input };
              }
            }
            // Eğer input object ise (MCP tool'lar için) direkt kullan
            else if (input && typeof input === 'object') {
              const inputObj = input as Record<string, unknown>;
              // Nested args kontrolü - metadata'yı değil gerçek args'ı al
              if (inputObj.args && typeof inputObj.args === 'object') {
                argsForCapture = inputObj.args as Record<string, unknown>;
              } else {
                argsForCapture = inputObj;
              }
            }

            // Middleware context oluştur
            const middlewareContext: ToolMiddlewareContext = {
              sessionId,
              conversationId,
              toolName: originalTool.name,
              arguments: argsForCapture,
              timestamp: Date.now(),
            };

            // Arguments'ları Map'e kaydet (real-time streaming için)
            if (
              argsForCapture &&
              typeof argsForCapture === 'object' &&
              Object.keys(argsForCapture).length > 0
            ) {
              this.executionArguments.set(executionKey, {
                sessionId,
                toolName: originalTool.name,
                arguments: argsForCapture,
                timestamp: Date.now(),
                status: 'executing',
              });

              console.log(`🔧 Tool ${originalTool.name} called with args:`, argsForCapture);
            }

            // Before middleware hooks'ları çalıştır
            await this.executeMiddlewareHooks('before', middlewareContext);

            // Tool'u çalıştır
            const result = await originalInvoke(input, config);

            // Success durumunda status'u güncelle
            const executionData = this.executionArguments.get(executionKey);
            if (executionData) {
              executionData.status = 'completed';
              this.executionArguments.set(executionKey, executionData);
            }

            // After middleware hooks'ları çalıştır (void - transform etmez)
            await this.executeMiddlewareHooks('after', middlewareContext, result);

            // FormatResponse middleware hooks'ları çalıştır - transformed result'ı al
            const transformedResult = await this.executeMiddlewareHooks(
              'formatResponse',
              middlewareContext,
              result,
            );

            console.log(`✅ Tool ${originalTool.name} completed successfully`);
            // Eğer formatResponse middleware result transform ettiyse, transform edilmiş result'ı döndür
            return transformedResult !== undefined ? transformedResult : result;
          } catch (error) {
            console.error(`❌ Tool ${originalTool.name} ERROR:`, error);

            // Middleware context oluştur (error için)
            const middlewareContext: ToolMiddlewareContext = {
              sessionId,
              conversationId,
              toolName: originalTool.name,
              arguments: {},
              timestamp: Date.now(),
            };

            // Error middleware hooks'ları çalıştır
            await this.executeMiddlewareHooks('error', middlewareContext, error);

            // Error'ı execution Map'ine kaydet
            const errorMessage = error instanceof Error ? error.message : String(error);
            const executionData = this.executionArguments.get(executionKey);
            if (executionData) {
              executionData.status = 'error';
              executionData.error = errorMessage;
              this.executionArguments.set(executionKey, executionData);
            } else {
              // Arguments yoksa da error'ı kaydet
              this.executionArguments.set(executionKey, {
                sessionId,
                toolName: originalTool.name,
                arguments: {},
                timestamp: Date.now(),
                status: 'error',
                error: errorMessage,
              });
            }

            throw error;
          } finally {
            // Execution tamamlandığında Map'ten temizle (5 saniye sonra)
            setTimeout(() => {
              this.executionArguments.delete(executionKey);
            }, 5000);
          }
        },
      };
    }

    // Fallback: original tool'u döndür
    return originalTool;
  }

  /**
   * Authentication tool'larını oluşturur
   */
  static createAuthenticationTools(sessionId: string): DynamicStructuredTool[] {
    return [
      // Login tool - DynamicStructuredTool ile
      new DynamicStructuredTool({
        name: 'insurup_login',
        description:
          'InsurUp platformuna giriş yapmak için kullanılır. TC kimlik numarası, telefon numarası ve doğum tarihi gereklidir.',
        schema: z.object({
          identityNumber: z.string().describe('TC kimlik numarası (11 haneli)'),
          phoneNumber: z.string().describe('Telefon numarası (Ülke kodu olmadan)'),
          birthDate: z.string().describe('Doğum tarihi (YYYY-MM-DD formatında)'),
          phoneCountryCode: z.string().optional().describe('Telefon ülke kodu (opsiyonel)'),
        }),
        func: async ({ identityNumber, phoneNumber, birthDate, phoneCountryCode }) => {
          // Validation
          if (!identityNumber || !/^\d{11}$/.test(identityNumber)) {
            return JSON.stringify({
              success: false,
              error: CHAT_ERRORS.INVALID_IDENTITY_NUMBER,
            });
          }

          if (!phoneNumber) {
            return JSON.stringify({
              success: false,
              error: CHAT_ERRORS.PHONE_NUMBER_REQUIRED,
            });
          }

          const result = await AuthService.login({
            identityNumber,
            phoneCountryCode: phoneCountryCode || CHAT_CONSTANTS.PHONE_DEFAULT_COUNTRY_CODE,
            phoneNumber,
            birthDate,
          });

          return JSON.stringify({
            success: true,
            message: result.message,
            loginToken: result.loginToken || result.token,
            mfaRequired: result.mfaRequired,
          });
        },
      }),

      // MFA verification tool - DynamicStructuredTool ile
      new DynamicStructuredTool({
        name: 'insurup_verify_mfa',
        description:
          'InsurUp MFA kodunu doğrulamak için kullanılır. Login token ve 6 haneli SMS kodu gereklidir.',
        schema: z.object({
          loginToken: z.string().describe('Login işleminden dönen token'),
          mfaCode: z.string().describe('6 haneli SMS kodu'),
        }),
        func: async ({ loginToken, mfaCode }) => {
          if (!loginToken) {
            return JSON.stringify({
              success: false,
              error: CHAT_ERRORS.LOGIN_TOKEN_REQUIRED,
            });
          }

          const code = String(mfaCode);
          if (!code || !/^\d{6}$/.test(code)) {
            return JSON.stringify({
              success: false,
              error: CHAT_ERRORS.INVALID_MFA_CODE,
            });
          }

          const result = await AuthService.verifyMfa(
            {
              loginToken,
              mfaCode: code,
            },
            sessionId,
          );

          if (result.success) {
            // MCP client'ı yenile (auth token'lar değiştiği için)
            const { MCPClientManager } = await import('./mcp-client-manager.service');
            await MCPClientManager.refreshSessionClient(sessionId);
            console.log('✅ MFA verification successful, client refreshed');
          }

          return JSON.stringify({
            success: result.success,
            message: result.message,
            authenticated: result.success,
          });
        },
      }),

      // Auth status tool - parametresiz
      new DynamicStructuredTool({
        name: 'insurup_auth_status',
        description: 'InsurUp giriş durumunu kontrol eder.',
        schema: z.object({}), // Boş schema - parametre yok
        func: async () => {
          const status = await AuthService.getAuthStatus(sessionId);
          return JSON.stringify(status);
        },
      }),

      // Logout tool - parametresiz
      new DynamicStructuredTool({
        name: 'insurup_logout',
        description:
          "InsurUp'tan çıkış yapar. Auth bilgilerini temizler ve yeni session oluşturur.",
        schema: z.object({}), // Boş schema - parametre yok
        func: async () => {
          // AuthService logout kullan (createNewSession: true)
          const newSessionId = (await AuthService.logout(sessionId, true)) as string;

          return JSON.stringify({
            success: true,
            message: 'Çıkış yapıldı. Yeni session oluşturuldu.',
            newSessionId: newSessionId,
            _cookieUpdate: true, // Controller'a cookie güncellemesi gerektiğini bildiren özel flag
            _refreshClient: true, // Client refresh gerektiğini bildiren flag
          });
        },
      }),
    ];
  }

  /**
   * Proposal tool'larını oluşturur
   */
  static createProposalTools(sessionId: string): DynamicStructuredTool[] {
    return [
      // Şu an için proposal tool'ları MCP middleware ile handle ediliyor
      // Gelecekte burada proposal-specific tool'lar eklenebilir
    ];
  }

  /**
   * Tüm tool'ları (MCP + Auth + Proposal) birleştirir ve universal wrapper uygular
   */
  static combineAndWrapTools(
    mcpTools: StructuredToolInterface[],
    sessionId: string,
    conversationId?: string,
  ): StructuredToolInterface[] {
    const authTools = this.createAuthenticationTools(sessionId);
    const proposalTools = this.createProposalTools(sessionId);

    const allTools: StructuredToolInterface[] = [...mcpTools, ...authTools, ...proposalTools];

    return allTools.map((tool) =>
      this.createUniversalToolWithArgumentCapture(tool, sessionId, conversationId),
    );
  }

  /**
   * Middleware'leri temizler
   */
  static clearToolMiddleware(): void {
    this.toolMiddlewareRegistry.clear();
    console.log('🧹 All tool middlewares cleared');
  }

  /**
   * Tool middleware istatistiklerini döndürür
   */
  static getToolMiddlewareStatistics(): {
    totalMiddlewares: number;
    toolsWithMiddleware: string[];
  } {
    const toolsWithMiddleware = Array.from(this.toolMiddlewareRegistry.keys());
    let totalMiddlewares = 0;

    for (const middlewares of this.toolMiddlewareRegistry.values()) {
      totalMiddlewares += middlewares.length;
    }

    return {
      totalMiddlewares,
      toolsWithMiddleware,
    };
  }

  /**
   * Execution arguments istatistiklerini döndürür
   */
  static getExecutionStatistics(): {
    executionArguments: number;
  } {
    return {
      executionArguments: this.executionArguments.size,
    };
  }

  /**
   * Belirli bir execution argument'ını döndürür
   */
  static getExecutionArgument(sessionId: string, toolName: string): ExecutionArgument | undefined {
    const executionKey = `${sessionId}-${toolName}`;
    return this.executionArguments.get(executionKey);
  }

  /**
   * Tüm execution arguments'ları temizler
   */
  static clearExecutionArguments(): void {
    this.executionArguments.clear();
  }
}
