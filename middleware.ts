import { NextResponse, type NextRequest } from "next/server";
import { REFRESH_TOKEN_COOKIE } from "@/lib/auth/cookies";

// Access tokens live only in memory (lost on reload), so the refresh-token
// cookie is the sole signal middleware can check. Its presence doesn't prove
// the token is still valid — AuthProvider's silent refresh on mount is what
// actually confirms the session and signs the user out if refresh fails.
export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has(REFRESH_TOKEN_COOKIE);

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/assets/:path*",
    "/import/:path*",
    "/claims/:path*",
    "/customers/:path*",
    "/renewals/:path*",
    "/analytics/:path*",
    "/audit-log/:path*",
    "/team/:path*",
    "/settings/:path*",
    "/enterprise/status",
  ],
};
