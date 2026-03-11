import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { allowPinAttempt } from "../../../../lib/rateLimit";
import { setSessionCookie } from "../../../../lib/auth";

const schema = z.object({
  teamId: z.string().uuid(),
  pin: z.string().regex(/^\d{4,6}$/)
});

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.ip ||
    "unknown";

  try {
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Unable to verify details. Please check and try again." },
        { status: 400 }
      );
    }

    const { teamId, pin } = parsed.data;

    const allowed = await allowPinAttempt({ teamId, ip });
    if (!allowed) {
      return NextResponse.json(
        {
          error:
            "Unable to verify details. Please wait a few minutes before trying again."
        },
        { status: 429 }
      );
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId }
    });

    if (!team) {
      // Generic error message only
      return NextResponse.json(
        { error: "Unable to verify details. Please check and try again." },
        { status: 400 }
      );
    }

    const ok = await bcrypt.compare(pin, team.pinHash);
    if (!ok) {
      // Same generic error
      return NextResponse.json(
        { error: "Unable to verify details. Please check and try again." },
        { status: 400 }
      );
    }

    await prisma.team.update({
      where: { id: team.id },
      data: { sharePin: pin }
    });

    setSessionCookie(team.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Unable to verify details. Please try again later." },
      { status: 500 }
    );
  }
}
