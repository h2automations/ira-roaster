import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";

const schema = z.object({
  email: z.string().email()
});

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    }

    const email = parsed.data.email.trim();
    const emailNormalized = email.toLowerCase();
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.adminOtp.create({
      data: {
        email,
        emailNormalized,
        otpHash,
        expiresAt
      }
    });

    if (process.env.NODE_ENV !== "production") {
      console.log(`[admin-otp] ${email}: ${otp}`);
      return NextResponse.json({ success: true, devOtp: otp });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Unable to request OTP right now." },
      { status: 500 }
    );
  }
}
