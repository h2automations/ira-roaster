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

    const otpRecord = await prisma.adminOtp.findFirst({
      where: {
        emailNormalized,
        consumedAt: null
      },
      orderBy: { createdAt: "desc" }
    });

    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Unable to verify OTP. Please try again." },
        { status: 400 }
      );
    }

    const ok = await bcrypt.compare(parsed.data.otp, otpRecord.otpHash);
    if (!ok) {
      return NextResponse.json(
        { error: "Unable to verify OTP. Please try again." },
        { status: 400 }
      );
    }

    await prisma.adminOtp.update({
      where: { id: otpRecord.id },
      data: { consumedAt: new Date() }
    });

    setAdminSessionCookie(otpRecord.email);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Unable to verify OTP right now." },
      { status: 500 }
    );
  }
}
