import { NextResponse } from "next/server";
import { REFRESH_TOKEN_COOKIE } from "@/lib/auth/cookies";

export async function POST() {
  // Cognito's refresh tokens have no public sign-out/revoke endpoint exposed
  // by this backend — dropping the cookie just stops this browser from being
  // able to silently refresh a new access token.
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
  return response;
}
