import { Resend } from "resend";
import sgMail from "@sendgrid/mail";

type EmailProvider = "resend" | "sendgrid";

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

  throw new Error(`Unsupported EMAIL_PROVIDER: ${provider}`);
}

