import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { setAdminSessionCookie } from "../../../../lib/auth";

const schema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/)
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Unable to verify OTP. Please try again." },
        { status: 400 }
      );
    }

    const emailNormalized = parsed.data.email.trim().toLowerCase();

    const otpRecords = await prisma.adminOtp.findMany({
      where: {
        emailNormalized,
        consumedAt: null,
        expiresAt: {
          gte: new Date()
        }
      },
      orderBy: { createdAt: "desc" },
      take: 5
    });

    if (!otpRecords.length) {
      return NextResponse.json(
        { error: "Unable to verify OTP. Please try again." },
        { status: 400 }
      );
    }

    const enteredOtp = parsed.data.otp.trim();
    let matchedRecord: (typeof otpRecords)[number] | null = null;
    for (const record of otpRecords) {
      const ok = await bcrypt.compare(enteredOtp, record.otpHash);
      if (ok) {
        matchedRecord = record;
        break;
      }
    }

    if (!matchedRecord) {
      return NextResponse.json(
        { error: "Unable to verify OTP. Please try again." },
        { status: 400 }
      );
    }

    const consumeResult = await prisma.adminOtp.updateMany({
      where: {
        id: matchedRecord.id,
        consumedAt: null
      },
      data: {
        consumedAt: new Date()
      }
    });
    if (consumeResult.count !== 1) {
      return NextResponse.json(
        { error: "Unable to verify OTP. Please try again." },
        { status: 400 }
      );
    }

    setAdminSessionCookie(matchedRecord.email);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Unable to verify OTP right now." },
      { status: 500 }
    );
  }
}
