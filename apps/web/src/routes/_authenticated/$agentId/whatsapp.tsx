import { WhatsAppConfigForm } from '#/components/form/whatsapp-config-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/$agentId/whatsapp')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="container mx-auto p-6 mt-5">
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">WhatsApp Chatbot Yönetimi</h1>
        </div>
        
        <Card className=''>
          <CardHeader>
            <CardTitle>WhatsApp Konfigürasyonu</CardTitle>
            <CardDescription>
              WhatsApp Business API'si için gerekli bilgileri girin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WhatsAppConfigForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
