import twilio from "twilio";

type WhatsappProvider = "twilio";

const provider = (process.env.WHATSAPP_PROVIDER ||
  "twilio") as WhatsappProvider;

export async function sendWhatsapp(params: {
  to: string;
  message: string;
}): Promise<void> {
  const { to, message } = params;

  if (!to) return;

  if (provider === "twilio") {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_FROM;

    if (!accountSid || !authToken || !from) {
      console.warn(
        "[WhatsApp] Twilio not fully configured. Skipping WhatsApp send."
      );
      return;
    }

    const client = twilio(accountSid, authToken);

    try {
      await client.messages.create({
        from,
        to,
        body: message
      });
    } catch (err) {
      console.error("[WhatsApp] Failed to send message", err);
    }

    return;
  }

  console.warn(
    `[WhatsApp] Unsupported WHATSAPP_PROVIDER "${provider}". Skipping send.`
  );
}

