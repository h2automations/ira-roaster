import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { sendAdminOtpEmail } from "../../../../lib/email";

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
    const managerTeam = await prisma.team.findFirst({
      where: {
        managerEmail: {
          equals: email,
          mode: "insensitive"
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      select: {
        managerEmail: true
      }
    });

    if (!managerTeam) {
      return NextResponse.json(
        { error: "No account found for this email." },
        { status: 400 }
      );
    }

    const canonicalEmail = managerTeam.managerEmail.trim();
    const emailNormalized = canonicalEmail.toLowerCase();
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.adminOtp.deleteMany({
      where: {
        emailNormalized,
        consumedAt: null
      }
    });

    const otpRecord = await prisma.adminOtp.create({
      data: {
        email: canonicalEmail,
        emailNormalized,
        otpHash,
        expiresAt
      }
    });

    // TODO: remove devOtp from response before go-live
    console.log(`[admin-otp] ${canonicalEmail}: ${otp}`);
    return NextResponse.json({
      success: true,
      devOtp: otp,
      channel: "email",
      sentTo: canonicalEmail
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Unable to request OTP right now." },
      { status: 500 }
    );
  }
}
