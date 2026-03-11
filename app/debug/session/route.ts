import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken } from "../../../lib/auth";

export async function GET() {
  const token = cookies().get("ira_roster_session")?.value || null;
  const payload = token ? verifySessionToken(token) : null;

  return NextResponse.json({
    hasCookie: !!token,
    tokenPreview: token ? token.slice(0, 20) + "..." : null,
    payload,
  });
}
