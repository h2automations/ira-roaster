import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { prisma } from "./prisma";

const useUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

let ratelimit: Ratelimit | null = null;

if (useUpstash) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!
  });
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(5, "900 s"), // 5 attempts per 15 minutes
    timeout: 1000
  });
}

/**
 * Rate limit PIN verification attempts per team + IP.
 * Returns `true` if allowed, `false` if blocked.
 */
export async function allowPinAttempt(params: {
  teamId: string;
  ip: string;
}): Promise<boolean> {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  const { teamId, ip } = params;

  if (ratelimit) {
    const { success } = await ratelimit.limit(`pin:${teamId}:${ip}`);
    return success;
  }

  // Fallback: DB-based rate limiting using PinAttempt
  const now = new Date();
  const record = await prisma.pinAttempt.findFirst({
    where: { teamId, ip }
  });

  if (record?.lockedUntil && record.lockedUntil > now) {
    return false;
  }

  const count = record ? record.count + 1 : 1;
  const lockedUntil =
    count >= 5 ? new Date(now.getTime() + 15 * 60 * 1000) : null;

  if (record) {
    await prisma.pinAttempt.update({
      where: { id: record.id },
      data: { count, lockedUntil }
    });
  } else {
    await prisma.pinAttempt.create({
      data: { teamId, ip, count, lockedUntil }
    });
  }

  return lockedUntil == null;
}
