const graphURL = "https://graph.facebook.com";
const API_VERSION = "v22.0";



interface WhatsappConfig {
  accessToken: string;
  phoneNumberId: string;
}

export function whatsapp({ accessToken, phoneNumberId }: WhatsappConfig) {
  return {
    message: {
      async text({ body, to }: { body: string; to: string }) {
        return await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "text",
            "text": {
              "preview_url": false,
              "body": body
            }
          }),
        });
      },
    },
  };
}
