import { CustomPostgresSaver } from '#modules/chat/shared/custom-postgres-saver';

/**
 * PostgreSQL checkpointer management için service
 */
export class CheckpointerService {
  private static checkpointer: CustomPostgresSaver | undefined;

  /**
   * Checkpointer'ı initialize eder
   */
  static async initialize(): Promise<void> {
    if (this.checkpointer) {
      return; // Already initialized
    }

    try {
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL is required for checkpointer');
      }

      this.checkpointer = CustomPostgresSaver.fromConnString(databaseUrl);
      await this.checkpointer.setup();

      console.log('✅ PostgresSaver checkpointer initialized successfully');
    } catch (error) {
      console.error('❌ PostgresSaver setup failed:', error);
      throw new Error(
        `PostgresSaver initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Checkpointer'ı döndürür
   */
  static getCheckpointer(): CustomPostgresSaver | undefined {
    return this.checkpointer;
  }

  /**
   * Checkpointer'ın initialize edilip edilmediğini kontrol eder
   */
  static isInitialized(): boolean {
    return !!this.checkpointer;
  }

  /**
   * Checkpointer istatistiklerini döndürür
   */
  static getStatistics(): {
    type: string;
    initialized: boolean;
    databaseUrl: string | null;
  } {
    return {
      type: this.checkpointer ? 'PostgresSaver' : 'none',
      initialized: !!this.checkpointer,
      databaseUrl: process.env.DATABASE_URL || null,
    };
  }

  /**
   * Checkpointer'ı cleanup eder (graceful shutdown için)
   */
  static async cleanup(): Promise<void> {
    try {
      if (this.checkpointer) {
        // PostgresSaver'da explicit close metodu varsa burada çağrılabilir
        // Şu an için sadece reference'ı temizliyoruz
        this.checkpointer = undefined;
        console.log('✅ Checkpointer cleaned up successfully');
      }
    } catch (error) {
      console.error('❌ Checkpointer cleanup failed:', error);
    }
  }
}
