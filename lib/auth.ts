import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
const SESSION_COOKIE_NAME = "ira_roster_session";
const ADMIN_COOKIE_NAME = "ira_admin_session";
const SESSION_TTL_SECONDS = 30 * 60; // 30 minutes
const ADMIN_SESSION_TTL_SECONDS = 45 * 60; // 45 minutes

type SessionPayload = {
  teamId: string;
};
type AdminSessionPayload = {
  admin: true;
  email: string;
};

function getJwtSecret(): string {
  const raw = process.env.JWT_SECRET;
  const secret = raw?.trim().replace(/^["']|["']$/g, "");
  if (secret) return secret;

  if (process.env.NODE_ENV !== "production") {
    return "ira_roster_dev_fallback_secret_change_me";
  }

  throw new Error("JWT_SECRET missing");
}


export function signSession(teamId: string): string {
  const secret = getJwtSecret();
  const token = jwt.sign({ teamId } satisfies SessionPayload, secret, {
    expiresIn: SESSION_TTL_SECONDS
  });
  return token;
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as SessionPayload;
    if (!decoded.teamId) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function getSessionFromCookies(): SessionPayload | null {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function setSessionCookie(teamId: string) {
  const token = signSession(teamId);
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_SECONDS,
    path: "/"
  });
}

export function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/"
  });
}

function signAdminSession(email: string): string {
  const secret = getJwtSecret();
  return jwt.sign({ admin: true, email } satisfies AdminSessionPayload, secret, {
    expiresIn: ADMIN_SESSION_TTL_SECONDS
  });
}

export function verifyAdminSessionToken(token: string): AdminSessionPayload | null {
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as AdminSessionPayload;
    if (!decoded.admin || !decoded.email) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function getAdminSessionFromCookies(): AdminSessionPayload | null {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminSessionToken(token);
}

export function setAdminSessionCookie(email: string) {
  const token = signAdminSession(email);
  const cookieStore = cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
    path: "/"
  });
}

export function clearAdminSessionCookie() {
  const cookieStore = cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/"
  });
}
