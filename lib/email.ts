import { Resend } from "resend";
import sgMail from "@sendgrid/mail";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

type EmailProvider = "resend" | "sendgrid" | "ses";

const provider = (process.env.EMAIL_PROVIDER || "resend") as EmailProvider;

function getFromAddress(): string {
  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error("EMAIL_FROM is not configured");
  }
  return from;
}

export async function sendTeamPinEmail(params: {
  to: string;
  teamName: string;
  pin: string;
  rosterUrl: string;
}) {
  const { to, teamName, pin, rosterUrl } = params;
  const from = getFromAddress();
  const subject = "Your Team Roster PIN";
  const bodyText = [
    `Hello,`,
    ``,
    `Your team "${teamName}" has been registered with IRA Sportswear's Team Roster Management System.`,
    ``,
    `PIN: ${pin}`,
    ``,
    `You can manage your roster here: ${rosterUrl}`,
    ``,
    `Security note: Keep this PIN private. Anyone with the team name and PIN can update this roster.`
  ].join("\n");

  if (provider === "resend") {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    const resend = new Resend(apiKey);
    // await resend.emails.send({
    //   from,
    //   to,
    //   subject,
    //   text: bodyText
    // });
    return;
  }

  if (provider === "sendgrid") {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error("SENDGRID_API_KEY is not configured");
    }
    sgMail.setApiKey(apiKey);
    // await sgMail.send({
    //   to,
    //   from,
    //   subject,
    //   text: bodyText
    // });
    return;
  }

  if (provider === "ses") {
    const ses = new SESClient({ region: process.env.AWS_REGION || "us-east-1" });
    await ses.send(new SendEmailCommand({
      Source: from,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject },
        Body: { Text: { Data: bodyText } }
      }
    }));
    return;
  }

  throw new Error(`Unsupported EMAIL_PROVIDER: ${provider}`);
}

export async function sendAdminOtpEmail(params: {
  to: string;
  otp: string;
}): Promise<void> {
  const { to, otp } = params;
  const from = getFromAddress();
  const subject = "Your Admin OTP";
  const bodyText = [
    `Hello,`,
    ``,
    `Your admin OTP for IRA Sportswear Team Roster System is:`,
    ``,
    `${otp}`,
    ``,
    `This OTP expires in 5 minutes. Do not share it with anyone.`
  ].join("\n");

  if (provider === "ses") {
    const ses = new SESClient({ region: process.env.AWS_REGION || "us-east-1" });
    await ses.send(new SendEmailCommand({
      Source: from,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject },
        Body: { Text: { Data: bodyText } }
      }
    }));
    return;
  }

  if (provider === "resend") {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
    const resend = new Resend(apiKey);
    await resend.emails.send({ from, to, subject, text: bodyText });
    return;
  }

  if (provider === "sendgrid") {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) throw new Error("SENDGRID_API_KEY is not configured");
    sgMail.setApiKey(apiKey);
    await sgMail.send({ to, from, subject, text: bodyText });
    return;
  }

  throw new Error(`Unsupported EMAIL_PROVIDER for OTP: ${provider}`);
}

