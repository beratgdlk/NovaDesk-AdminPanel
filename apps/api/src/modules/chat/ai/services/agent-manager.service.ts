import type { StructuredToolInterface } from '@langchain/core/tools';
import type { CreateReactAgentParams } from '@langchain/langgraph/prebuilt';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import prisma, { vectorStore } from '@onlyjs/db';
import { LLM_MODELS } from '@onlyjs/shared-config';
import { z } from 'zod';
import type { ChatbotInstructions } from '#types.ts';
import { AuthService } from '../../auth/service';
import { CheckpointerService } from './checkpointer.service';
import { ToolManager } from './tool-manager.service';

/**
 * Agent management, system prompt ve model selection için service
 */
export class AgentManager {
  /**
   * Session için system prompt oluşturur
   */
  static async getSystemPrompt(
    sessionId: string,
    agentInstructions: Omit<ChatbotInstructions, 'welcomeMessage'> | null = {},
  ): Promise<string> {
    const authStatus = await AuthService.getAuthStatus(sessionId);

    return `Sen InsurUp sigortacılık platformu için özel olarak tasarlanmış bir AI asistansın.

Görevlerin:
- Kullanıcıların sigorta poliçeleri, teklifleri ve hesap bilgileri hakkında sorularını yanıtlamak
- InsurUp API'lerini kullanarak gerekli bilgileri almak
- Türkçe dilinde samimi ve yardımsever bir ton kullanmak
- Karmaşık sigorta terimlerini basit bir şekilde açıklamak
- Kullanıcının giriş durumunu kontrol etmek ve gerektiğinde giriş yapmalarına yardım etmek


MEVCUT GİRİŞ DURUMU:
${
  authStatus.isAuthenticated
    ? `✅ Kullanıcı giriş yapmış durumda
- User ID: ${authStatus.userId ?? 'Belirtilmemiş'}`
    : `❌ Kullanıcı giriş yapmamış durumda`
}

${
  !authStatus.isAuthenticated
    ? `
ÖNEMLI: Kullanıcı henüz giriş yapmamış. Sigorta bilgilerine erişmek için önce giriş yapması gerekiyor.

Kullanıcı giriş yapmak istediğinde:
1. Önce 'insurup_auth_status' tool'u ile giriş durumunu kontrol et
2. Giriş yapılmamışsa 'insurup_login' tool'u ile giriş işlemini başlat
3. TC kimlik numarası, telefon numarası ve doğum tarihini iste
4. Login başarılı olursa 'insurup_verify_mfa' tool'u ile MFA kodunu doğrulat
5. Tüm işlem tamamlandığında kullanıcıya başarı mesajı ver

GİRİŞ YAPMA İŞLEMİ İÇİN SADEȘCEBELİRTTİĞİM TOOL'LARI KULLAN, MCP TOOL'LARINI KULLANMA.

TOOL KULLANIMI ÖRNEKLERİ:
- insurup_login tool'u için: {"identityNumber": "12345678901", "phoneNumber": "5551234567", "birthDate": "1990-01-01"}
- insurup_verify_mfa tool'u için: {"loginToken": "abc123", "mfaCode": "123456"}

KRİTİK ÖNEM: 
1. Tool'ları çağırırken parametreleri MUTLAKA dolu JSON formatında ver
2. BOŞ parametre {} GEÇİRME - her zaman gerekli tüm alanları doldur
3. Kullanıcı eksik bilgi verirse, önce eksik bilgileri iste
4. Tool call yapmadan önce tüm gerekli parametrelerin mevcut olduğundan emin ol
5. Tool call'da args boş gelirse, kullanıcının verdiği bilgileri doğru şekilde kullan

HATIRLA: Tool'lar parametresiz çalışmaz. Her tool call'da gerekli tüm bilgileri gönder!

ÖZEL DURUM: Eğer tool call'da args boş ({}) gelirse, kullanıcının önceki mesajlarından bilgileri çıkar ve doğru şekilde kullan.
`
    : `
✅ Kullanıcı giriş yapmış durumda. Artık tüm InsurUp API'lerini kullanarak kullanıcının:
- Sigorta poliçelerini
- Tekliflerini  
- Hesap bilgilerini
- Diğer kişisel verilerini sorgulayabilirsin.

Kullanıcının herhangi bir bilgisini gizlemene gerek yok.

Kullanıcı çıkış yapmak istediğinde 'insurup_logout' tool'unu kullan.

ÖNEMLİ: KASKO TEKLİF OLUŞTURMA REHBERİ
Teklif oluşturma işlemi yaparken:
1. Kullanıcının aracı yoksa önce kullanıcıyı araç eklemeye yönlendir.
2. Kullanıcının bir aracı varsa o araçla mı devam etmek istediğini yoksa yeni araç mı eklemek istediğini sor.
3. Kullanıcının birden fazla aracı varsa araçlarını listeleyip o araçlar arasından mı devam etmek istediğini yoksa yeni araç mı eklemek istediğini sor.

ÖNEMLİ: TEKLİF OLUŞTURMA SONRASI DAVRANIŞI
Herhangi bir teklif oluşturma işlemi (create proposal) yaptıktan sonra:

1. ASLA hemen 'insurup_get_proposal_products' tool'unu çağırma!
2. Teklifler anlık çıkmaz - birkaç dakika sürer
3. Kullanıcıya şu şekilde bilgi ver:

   "Teklif talebiniz başarıyla oluşturuldu! ✅
   
   Sigorta şirketlerinden fiyatlar gelmesi 2-3 dakika sürebilir. 
   Lütfen biraz bekleyin, sonra tekrar 'tekliflerimi göster' diyerek kontrol edebilirsiniz.
   
   Bu sürede başka bir işlem yapmak isterseniz size yardımcı olabilirim."

4. Kullanıcı daha sonra manuel olarak teklifleri sorgularsa o zaman tool'u çağır

ÖNEMLİ: TEKLİF DETAYI VE ÜRÜN SORGULAMA REHBERİ
GetProposalDetail artık hem teklif detaylarını hem de tüm ürünleri (products) içerir ve otomatik formatlanır:

1. İLK SUNUMDA: Kullanıcı dostu formatta sun:
   "[Araç model] aracın için bazı sigorta şirketlerinden fiyatlar geldi:
   
   1. **[Şirket Adı]** peşin fiyatına [Peşin (1 Taksit) fiyatı]  
   2. **[Şirket Adı]** peşin fiyatına [Peşin (1 Taksit) fiyatı]
   3. **[Şirket Adı]** peşin fiyatına [Peşin (1 Taksit) fiyatı]
   
   Dilersen şirketlerin teminat bilgileri hakkında yardımcı olabilirim veya satın alma işlemine destek olabilirim."

2. Detay istendiğinde: 
   - Teminatlar, taksit seçenekleri gibi ek bilgileri natural bir şekilde sun
   - initialCoverage alanında temiz formatlanmış teminat bilgileri var (Türkçe, TL formatında)
   - Bu bilgileri kullanıcı dostu şekilde açıklayabilirsin

ÖNEMLİ: SATIN ALMA REHBERİ
Kullanıcı bir teklifi satın almak istediğinde:
1. Teklifin içerisindeki hangi ürünü satın almak istediğini sor.
2. Teklif ön bilgilendirme formu tool'unu çağırıp ön bilgilendirme formunu göster. 'Lütfen ek olarak iletilen ön bilgilendirme formunu okuyunuz. Formu okuyup onayınızı aldıktan sonra işleme devam edebiliriz.' diye mesaj dön. Tool call url'ini kullanıcıya mesaj olarak DÖNME.
3. Kullanıcı ön bilgilendirme formunu onaylarsa teklif detay pdf'ini göster. Tool'u çağırıp 'Lütfen ek olarak iletilen teklif detay dökümanını okuyunuz. Dökümanı okuyup onayınızı aldıktan sonra işleme devam edebiliriz.' diye mesaj dön ve satın alma aşamasına geç.
4. Satın alım yaparken 3D Secure kullanmak isteyip istemediğini sor, ona göre ilgili tool'u çağır
`
}

Tool çağırırken her zaman mcp olmayan (mcp_ ile başlamayan) tool'ları önceliklendir.

Her zaman kullanıcının ihtiyaçlarını anlamaya odaklan ve en doğru bilgiyi sağlamaya çalış.

${
  agentInstructions?.voiceTone
    ? `VOICE TONE:
  ${agentInstructions.voiceTone}`
    : ''
}

${
  agentInstructions?.aboutUs
    ? `ACENTE HAKKINDA:
  ${agentInstructions.aboutUs}`
    : ''
}
`;
  }

  /**
   * Model seçimi ve LLM oluşturur
   */
  static createLLM(selectedModel?: string | null): ChatOpenAI {
    const selectedModelConfig = selectedModel
      ? LLM_MODELS.find((m) => m.model === selectedModel) || LLM_MODELS[0]
      : LLM_MODELS[0];

    return new ChatOpenAI({
      ...selectedModelConfig,
      configuration: {
        ...selectedModelConfig.configuration,
        apiKey: process.env.OPENROUTER_API_KEY,
      },
    });
  }

  /**
   * Agent oluşturur ve configure eder
   */
  static async setupAgent(
    mcpTools: StructuredToolInterface[],
    sessionId: string,
    selectedModel?: string | null,
    conversationId?: string,
  ) {
    const session = await prisma.conversationParticipantSession.findUnique({
      where: {
        token: sessionId,
      },
      select: {
        agent: {
          select: {
            id: true,
            chatbotInstructions: true,
          },
        },
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    const agent = session.agent;

    // Tool'ları ToolManager ile birleştir ve wrap et
    const allTools = ToolManager.combineAndWrapTools(mcpTools, sessionId, conversationId);

    // System prompt oluştur
    const systemPrompt = await this.getSystemPrompt(
      sessionId,
      agent.chatbotInstructions as ChatbotInstructions,
    );

    // LLM oluştur
    const llm = this.createLLM(selectedModel);

    // Checkpointer'ı initialize et (eğer henüz yapılmamışsa)
    if (!CheckpointerService.isInitialized()) {
      await CheckpointerService.initialize();
    }

    const agentVectorStoreTool = vectorStore
      .asRetriever({
        tags: ['agent'],
        filter: {
          agentId: {
            equals: agent.id,
          },
          isActive: {
            equals: true,
          },
        },
      })
      .asTool({
        name: 'insurup_agent_vector_store',
        description: 'InsurUp veritabanından acente verilerini çeker.',
        schema: z.string(),
      });

    const systemVectorStoreTool = vectorStore
      .asRetriever({
        tags: ['system'],
        filter: {
          agentId: {
            // biome-ignore lint/suspicious/noExplicitAny: <Wrong type>
            isNotNull: true as any,
          },
        },
      })
      .asTool({
        name: 'insurup_system_vector_store',
        description: 'InsurUp veritabanından sistem verilerini çeker.',
        schema: z.string(),
      });

    // Agent parametrelerini oluştur
    const agentParams: CreateReactAgentParams = {
      llm,
      tools: [...allTools, agentVectorStoreTool, systemVectorStoreTool],
      prompt: systemPrompt,
      checkpointSaver: CheckpointerService.getCheckpointer(),
    };

    return createReactAgent(agentParams);
  }
}
