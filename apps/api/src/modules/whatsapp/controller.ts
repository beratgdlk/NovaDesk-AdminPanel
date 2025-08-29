import { NotFoundException } from '#utils/http-errors.ts';
import { Elysia } from 'elysia';
import { AgentsService, type WhatsAppIntegrationConfig } from '../agents';
import { whatsapp } from './adapter';
const app = new Elysia({ prefix: '/whatsapp', tags: ['Whatsapp'] })
    .post("/message/:agentId", async ({ body, params }) => {

        const agent = await AgentsService.show(params.agentId)

        if (!agent) {
            throw new NotFoundException("Acente bulunamadı")
        }

        const { accessToken, phoneNumberId } = agent.whatsappIntegrationConfig as Required<WhatsAppIntegrationConfig>
        console.log(accessToken, phoneNumberId)
        const response = await whatsapp({
            accessToken,
            phoneNumberId,
        }).message.text({
            body: "text-message-content",
            to: "905419704273",
        })
        const result = await response.json()
        console.log(result)
        return result
    })

export default app;
