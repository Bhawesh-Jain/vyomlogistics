import { NextResponse, userAgent } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/session";

/**
 * Lightweight dashboard middleware
 * - Session check
 * - Device & IP tracking
 */
export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const response = NextResponse.next();

 
  const device = JSON.stringify(userAgent(request));
  const ip =
    request.ip ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for");

  response.cookies.set("client-ip", ip || "undefined-mw", {
    httpOnly: false,
    sameSite: "lax",
  });

  response.cookies.set("device-info", device || "", {
    httpOnly: false,
    sameSite: "lax",
  });

  
  const session = await getSession();

  if (!session.isLoggedIn || !session.user_id || !session.company_id) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

/* -----------------------------
 * Apply only to dashboard
 * ----------------------------- */
export const config = {
  matcher: "/dashboard/:path*"
};
