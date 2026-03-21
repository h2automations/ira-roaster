import twilio from "twilio";

type WhatsappProvider = "twilio" | "meta";

function resolveWhatsappProvider(): WhatsappProvider {
  const configuredProvider = (process.env.WHATSAPP_PROVIDER || "meta")
    .trim()
    .toLowerCase();
  if (configuredProvider === "twilio" || configuredProvider === "meta") {
    return configuredProvider;
  }
  return "meta";
}

const provider = resolveWhatsappProvider();

function normalizePhoneNumber(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;

  // Allow existing twilio-style values, but normalize for Meta API usage.
  const withoutPrefix = trimmed.replace(/^whatsapp:/i, "");
  return withoutPrefix.startsWith("+") ? withoutPrefix : `+${withoutPrefix}`;
}

function toTwilioWhatsappAddress(raw: string): string {
  const normalized = normalizePhoneNumber(raw);
  return normalized ? `whatsapp:${normalized}` : normalized;
}

export function maskPhoneNumber(raw: string): string {
  const normalized = normalizePhoneNumber(raw);
  if (normalized.length <= 6) return normalized;
  return `${normalized.slice(0, 4)}******${normalized.slice(-2)}`;
}

type MetaTemplateComponent = {
  type: "body";
  parameters: Array<{ type: "text"; text: string }>;
};

async function sendMetaTemplateMessage(params: {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: MetaTemplateComponent[];
}): Promise<void> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION || "v21.0";

  if (!accessToken || !phoneNumberId) {
    throw new Error("WhatsApp Meta configuration is missing.");
  }

  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalizePhoneNumber(params.to),
        type: "template",
        template: {
          name: params.templateName,
          language: { code: params.languageCode || "en" },
          ...(params.components ? { components: params.components } : {})
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Meta WhatsApp send failed (${response.status}): ${errorText}`
    );
  }
}

export async function sendWhatsapp(params: {
  to: string;
  message: string;
}): Promise<void> {
  const { to, message } = params;

  if (!to) return;

  if (provider === "meta") {
    const templateName = process.env.WHATSAPP_TEXT_TEMPLATE_NAME;
    if (!templateName) {
      console.warn(
        "[WhatsApp] WHATSAPP_TEXT_TEMPLATE_NAME is missing for Meta provider. Skipping message."
      );
      return;
    }

    try {
      await sendMetaTemplateMessage({
        to,
        templateName,
        components: [
          {
            type: "body",
            parameters: [{ type: "text", text: message }]
          }
        ]
      });
    } catch (err) {
      console.error("[WhatsApp] Failed to send Meta template message", err);
    }
    return;
  }

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
        to: toTwilioWhatsappAddress(to),
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

export async function sendAdminOtpWhatsapp(params: {
  to: string;
  otp: string;
}): Promise<{ maskedTo: string }> {
  if (!params.to) {
    throw new Error("WhatsApp number is missing.");
  }

  if (provider === "meta") {
    const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
    if (!templateName) {
      throw new Error("WHATSAPP_TEMPLATE_NAME is missing.");
    }

    await sendMetaTemplateMessage({
      to: params.to,
      templateName,
      components: [
        {
          type: "body",
          parameters: [{ type: "text", text: params.otp }]
        }
      ]
    });

    return { maskedTo: maskPhoneNumber(params.to) };
  }

  if (provider === "twilio") {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_FROM;
    if (!accountSid || !authToken || !from) {
      throw new Error("Twilio WhatsApp configuration is missing.");
    }

    const client = twilio(accountSid, authToken);
    await client.messages.create({
      from,
      to: toTwilioWhatsappAddress(params.to),
      body: `Your admin OTP is ${params.otp}. It expires in 5 minutes.`
    });

    return { maskedTo: maskPhoneNumber(params.to) };
  }

  throw new Error(
    `[WhatsApp] Unsupported WHATSAPP_PROVIDER "${provider}" for OTP send.`
  );
}
