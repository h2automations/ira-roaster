import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { sendTeamPinEmail } from "../../../../lib/email";
import { sendWhatsapp } from "../../../../lib/whatsapp";
import { setSessionCookie } from "../../../../lib/auth";
import { DEFAULT_ENABLED_PRODUCTS } from "../../../../lib/products";

const createRosterSchema = z.object({
  teamName: z.string().min(1),
  managerName: z.string().min(1),
  managerEmail: z.string().email(),
  whatsappNumber: z.string().optional().nullable(),
  pin: z
    .string()
    .regex(/^\d{4,6}$/),
  confirmPin: z.string()
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = createRosterSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data. Please check your inputs." },
        { status: 400 }
      );
    }
    const {
      teamName,
      managerName,
      managerEmail,
      whatsappNumber,
      pin,
      confirmPin
    } =
      parsed.data;

    if (pin !== confirmPin) {
      return NextResponse.json(
        { error: "PIN and Confirm PIN must match." },
        { status: 400 }
      );
    }

    const nameNormalized = teamName.trim().toLowerCase();

    const existing = await prisma.team.findUnique({
      where: { nameNormalized }
    });
    if (existing) {
      return NextResponse.json(
        { error: "A roster already exists for this team name." },
        { status: 409 }
      );
    }

    const pinHash = await bcrypt.hash(pin, 10);

    const team = await prisma.team.create({
      data: {
        name: teamName.trim(),
        nameNormalized,
        rosterName: teamName.trim(),
        managerName: managerName.trim(),
        managerEmail: managerEmail.trim(),
        whatsappNumber: whatsappNumber || null,
        pinHash,
        sharePin: pin,
        rosterTemplate: "sublimation",
        enabledProducts: DEFAULT_ENABLED_PRODUCTS
      }
    });

    const origin =
      req.headers.get("origin") || process.env.APP_BASE_URL || "";
    const rosterUrl = origin
      ? `${origin.replace(/\/+$/, "")}/roster/edit`
      : "/roster/edit";

    // // Email MUST be sent
    // await sendTeamPinEmail({
    //   to: team.managerEmail,
    //   teamName: team.name,
    //   pin,
    //   rosterUrl
    // });

    // WhatsApp SHOULD be sent if configured + number present
    if (team.whatsappNumber) {
      const msg = `Your IRA Sportswear roster PIN for team "${team.name}" is ${pin}. Manage your roster here: ${rosterUrl}`;
      await sendWhatsapp({
        to: team.whatsappNumber,
        message: msg
      });
    }

    // Start session immediately so manager lands in editor
    setSessionCookie(team.id);

    return NextResponse.json(
      { id: team.id, name: team.name, pin },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Unable to create roster at this time." },
      { status: 500 }
    );
  }
}
