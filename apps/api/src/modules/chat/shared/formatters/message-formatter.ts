import type {
  AIMessage,
  AIMessageChunk,
  HumanMessage,
  mapStoredMessageToChatMessage,
  ToolMessage,
} from '@langchain/core/messages';
import type { UIDataTypes, UIMessage, UIMessagePart, UITools } from 'ai';

// Concrete message types union
type LangChainMessage = ReturnType<typeof mapStoredMessageToChatMessage>;

// LangGraph mesajlarını gruplamak için helper interface
interface MessageGroup {
  mainMessage: LangChainMessage;
  toolMessages: ToolMessage[];
}

/**
 * BaseMessage'ları UIMessage formatına dönüştüren formatter
 */
export class MessageFormatter {
  /**
   * BaseMessage array'ini UIMessage array'ine dönüştürür
   */
  static formatMessages(messages: LangChainMessage[]): UIMessage[] {
    // BaseMessage'ları concrete type'lara cast et
    const langChainMessages = messages as LangChainMessage[];
    const messageGroups = this.groupMessages(langChainMessages);

    return messageGroups
      .map((group) => this.formatMessageGroup(group))
      .filter((message): message is UIMessage => message !== null);
  }

  /**
   * Mesajları ana mesaj ve tool mesajları olarak gruplar
   * LangGraph'ta tool call ve result'ları ayrı mesajlar gelir, bunları birleştirmeliyiz
   * Aynı zamanda consecutive AI mesajlarını da birleştiriyoruz (tool call + text response)
   */
  private static groupMessages(messages: LangChainMessage[]): MessageGroup[] {
    const groups: MessageGroup[] = [];
    let currentGroup: MessageGroup | null = null;

    for (const message of messages) {
      const messageType = this.getMessageType(message);

      // Tool message ise mevcut group'a ekle
      if (messageType === 'tool') {
        if (currentGroup) {
          currentGroup.toolMessages.push(message as ToolMessage);
        }
        continue;
      }

      // Human message ise yeni group başlat
      if (messageType === 'human') {
        // Önceki group'u kaydet
        if (currentGroup) {
          groups.push(currentGroup);
        }

        // Yeni group başlat
        currentGroup = {
          mainMessage: message,
          toolMessages: [],
        };
        continue;
      }

      // AI message ise...
      if (messageType === 'ai') {
        // Eğer mevcut group da AI ise, bu mesajı aynı group'ta birleştir
        if (currentGroup && this.getMessageType(currentGroup.mainMessage) === 'ai') {
          // Mevcut AI group'a bu AI mesajını birleştir
          this.mergeAIMessages(currentGroup, message);
        } else {
          // Önceki group'u kaydet
          if (currentGroup) {
            groups.push(currentGroup);
          }

          // Yeni AI group başlat
          currentGroup = {
            mainMessage: message,
            toolMessages: [],
          };
        }
      }
    }

    // Son group'u kaydet
    if (currentGroup) {
      groups.push(currentGroup);
    }

    return groups;
  }

  /**
   * İki AI mesajını birleştirir (tool call mesajı + text response mesajı)
   */
  private static mergeAIMessages(currentGroup: MessageGroup, newMessage: LangChainMessage): void {
    const currentMessage = currentGroup.mainMessage;
    const newMessageContent = this.extractTextContent(newMessage);

    // Yeni mesajda tool call'lar varsa, mevcut mesaja ekle
    if (this.isAIMessage(newMessage)) {
      const newAIMessage = newMessage as AIMessage | AIMessageChunk;
      const currentAIMessage = currentMessage as AIMessage | AIMessageChunk;

      // Tool calls'ları birleştir
      if (newAIMessage.tool_calls && newAIMessage.tool_calls.length > 0) {
        if (!(currentAIMessage as any).tool_calls) {
          (currentAIMessage as any).tool_calls = [];
        }
        (currentAIMessage as any).tool_calls.push(...newAIMessage.tool_calls);
      }
    }

    // Text content'i birleştir
    if (newMessageContent.trim()) {
      const currentContent = this.extractTextContent(currentMessage);
      const combinedContent = currentContent
        ? `${currentContent}\n\n${newMessageContent}`
        : newMessageContent;

      // Content'i güncelle
      if (typeof currentMessage.content === 'string') {
        (currentMessage as any).content = combinedContent;
      } else {
        // Content array ise, text part'ı bul ve güncelle veya ekle
        if (Array.isArray(currentMessage.content)) {
          const textPart = currentMessage.content.find(
            (part: any) => typeof part === 'object' && 'type' in part && part.type === 'text',
          );
          if (textPart) {
            (textPart as any).text = combinedContent;
          } else {
            currentMessage.content.push({ type: 'text', text: combinedContent });
          }
        } else {
          (currentMessage as any).content = combinedContent;
        }
      }
    }

    // Additional kwargs'ı birleştir
    if (newMessage.additional_kwargs) {
      Object.assign(currentMessage.additional_kwargs || {}, newMessage.additional_kwargs);
    }
  }

  /**
   * Message type'ını detect eder
   */
  private static getMessageType(message: LangChainMessage): 'human' | 'ai' | 'tool' {
    // Type guards ile detect et - önce class name check
    const className = message.constructor.name;

    if (className.includes('Human') || this.isHumanMessage(message)) {
      return 'human';
    } else if (className.includes('Tool') || this.isToolMessage(message)) {
      return 'tool';
    } else if (
      className.includes('AI') ||
      className.includes('Assistant') ||
      this.isAIMessage(message)
    ) {
      return 'ai';
    }

    // Default
    return 'ai';
  }

  /**
   * Type guard for HumanMessage
   */
  private static isHumanMessage(message: LangChainMessage): message is HumanMessage {
    try {
      return message.getType() === 'human';
    } catch {
      return false;
    }
  }

  /**
   * Type guard for ToolMessage
   */
  private static isToolMessage(message: LangChainMessage): message is ToolMessage {
    try {
      return message.getType() === 'tool' || 'tool_call_id' in message;
    } catch {
      return 'tool_call_id' in message;
    }
  }

  /**
   * Type guard for AI messages
   */
  private static isAIMessage(message: LangChainMessage): message is AIMessage | AIMessageChunk {
    try {
      return message.getType() === 'ai' || 'tool_calls' in message;
    } catch {
      return 'tool_calls' in message;
    }
  }

  /**
   * Bir message group'unu UIMessage'a dönüştürür
   */
  private static formatMessageGroup(group: MessageGroup): UIMessage | null {
    const { mainMessage, toolMessages } = group;
    const messageType = this.getMessageType(mainMessage);

    // Message role'ünü belirle
    const role = messageType === 'human' ? 'user' : 'assistant';

    // Content parts'ları oluştur
    const parts: UIMessagePart<UIDataTypes, UITools>[] = [];

    // Önce tool part'larını ekle (chronological sıra: tool call -> response)
    if (messageType === 'ai' && this.isAIMessage(mainMessage)) {
      const toolParts = this.extractToolParts(mainMessage, toolMessages);
      parts.push(...toolParts);
    }

    // Sonra ana mesaj content'ini ekle
    const textContent = this.extractTextContent(mainMessage);
    if (textContent.trim()) {
      const textMetadata = { ...((mainMessage.additional_kwargs as Record<string, any>) || {}) };
      delete textMetadata.tool_calls; // Text part'ında tool_calls temizle

      parts.push({
        type: 'text',
        text: textContent,
        providerMetadata: {
          backend: textMetadata,
        },
      });
    }

    // Boş mesajları skip et (sadece text content yoksa ve tool part'ları da yoksa)
    if (parts.length === 0) {
      return null;
    }

    // Part'ları sırala: tool calls önce, text content sonra
    parts.sort((a, b) => {
      const aIsTool = a.type.startsWith('tool-');
      const bIsTool = b.type.startsWith('tool-');

      if (aIsTool && !bIsTool) return -1; // a önce
      if (!aIsTool && bIsTool) return 1; // b önce
      return 0; // aynı tip, sıra değişmez
    });

    // Metadata'yı hazırla ve tool_calls'ı kaldır
    const metadata = { ...((mainMessage.additional_kwargs as Record<string, any>) || {}) };
    delete metadata.tool_calls;

    // Part'lardaki en erken timestamp'i bul
    const partTimestamps: Date[] = [];

    for (const part of parts) {
      const anyPart = part as any;
      if (anyPart.providerMetadata?.backend?.timestamp) {
        partTimestamps.push(new Date(anyPart.providerMetadata.backend.timestamp));
      }
      if (anyPart.callProviderMetadata?.backend?.timestamp) {
        partTimestamps.push(new Date(anyPart.callProviderMetadata.backend.timestamp));
      }
    }

    // Ana metadata timestamp'ini güncelle
    if (partTimestamps.length > 0) {
      const earliestTimestamp = new Date(Math.min(...partTimestamps.map((t) => t.getTime())));
      metadata.timestamp = earliestTimestamp.toISOString();
    }

    // UIMessage oluştur
    return {
      id: this.getMessageId(mainMessage),
      role,
      parts,
      metadata: {
        backend: metadata,
      },
    };
  }

  /**
   * Mesajdan text content'i çıkarır
   */
  private static extractTextContent(message: LangChainMessage): string {
    if (typeof message.content === 'string') {
      return message.content;
    }

    if (Array.isArray(message.content)) {
      return message.content
        .filter((part) => typeof part === 'object' && 'type' in part && part.type === 'text')
        .map((part) => (part as any).text || '')
        .join('');
    }

    return '';
  }

  /**
   * AI mesajından tool part'larını çıkarır ve tool result'larla birleştirir
   */
  private static extractToolParts(
    message: AIMessage | AIMessageChunk,
    toolMessages: ToolMessage[],
  ): UIMessagePart<UIDataTypes, UITools>[] {
    const parts: UIMessagePart<UIDataTypes, UITools>[] = [];

    // Tool call'ları hem tool_calls hem additional_kwargs.tool_calls'tan al
    // Type safety için any casting yapıyoruz çünkü tool_calls yapısı farklı provider'larda farklı
    const messageData = message;
    const toolCalls = messageData.tool_calls || [];

    // Duplicate'leri temizle
    const uniqueToolCalls = toolCalls.filter(
      (toolCall, index, arr) => arr.findIndex((tc) => tc.id === toolCall.id) === index,
    );

    for (const toolCall of uniqueToolCalls) {
      // Tool call property access'ini safe hale getir
      const toolName = toolCall.name || 'unknown_tool';
      const toolCallId = toolCall.id || Math.random().toString(36).substring(2, 15);

      // Arguments'ı parse et
      const parsedArgs = toolCall.args;

      // İlgili tool result'ı bul
      const toolResult = toolMessages.find((tm) => tm.tool_call_id === toolCallId);

      if (toolResult) {
        // Tool result mevcut ise output-available veya output-error state'i
        const resultContent = this.extractTextContent(toolResult);
        const isError = this.isErrorResult(resultContent);

        if (isError) {
          parts.push({
            type: `tool-${toolName}`,
            toolCallId,
            state: 'output-error',
            errorText: resultContent,
            input: parsedArgs,
            callProviderMetadata: {
              backend: (toolResult.additional_kwargs as Record<string, any>) || {},
            },
          });
        } else {
          parts.push({
            type: `tool-${toolName}`,
            toolCallId,
            state: 'output-available',
            input: parsedArgs,
            output: this.parseToolResult(resultContent),
            callProviderMetadata: {
              backend: (toolResult.additional_kwargs as Record<string, any>) || {},
            },
          });
        }
      } else {
        // Tool result yok ise input-available state'i
        parts.push({
          type: `tool-${toolName}`,
          toolCallId,
          state: 'input-available',
          input: parsedArgs,
          providerExecuted: false,
          callProviderMetadata: {
            backend: (message.additional_kwargs as Record<string, any>) || {},
          },
        });
      }
    }

    return parts;
  }

  /**
   * Tool result'ını parse eder
   */
  private static parseToolResult(result: string): unknown {
    // JSON ise parse et
    if (result.trim().startsWith('{') || result.trim().startsWith('[')) {
      try {
        return JSON.parse(result);
      } catch (e) {
        return result;
      }
    }

    return result;
  }

  /**
   * Result'un error olup olmadığını kontrol eder
   */
  private static isErrorResult(result: string): boolean {
    // String kontrolü
    if (
      result.toLowerCase().includes('error') ||
      result.toLowerCase().includes('failed') ||
      result.toLowerCase().includes('exception')
    ) {
      return true;
    }

    // JSON kontrolü
    try {
      const parsed = JSON.parse(result);
      return parsed.success === false || !!parsed.error;
    } catch (e) {
      return false;
    }
  }

  /**
   * Mesajdan ID çıkarır
   */
  private static getMessageId(message: LangChainMessage): string {
    return message.id || message.lc_id?.at(0) || Math.random().toString(36);
  }

  /**
   * Mesajdan timestamp çıkarır
   */
  private static getMessageTimestamp(message: LangChainMessage): Date {
    const timestamp = message.additional_kwargs?.created_at || message.additional_kwargs?.timestamp;

    if (timestamp && typeof timestamp === 'string') {
      return new Date(timestamp);
    }

    return new Date();
  }
}
