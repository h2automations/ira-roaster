import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIX = "/roster/edit";
const ADMIN_PREFIX = "/admin/teams";
const SESSION_COOKIE_NAME = "ira_roster_session";
const ADMIN_COOKIE_NAME = "ira_admin_session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith(PROTECTED_PREFIX)) {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/roster/update";
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith(ADMIN_PREFIX)) {
    const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/roster/edit/:path*", "/admin/teams/:path*"]
};
