import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { REFRESH_TOKEN_COOKIE } from "@/lib/auth/cookies";
import type { RefreshAuthResponse } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: "No session to refresh" }, { status: 401 });
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    return NextResponse.json({ error: "Can't reach the server" }, { status: 502 });
  }

  const payload = await backendResponse.json().catch(() => ({}));

  if (!backendResponse.ok) {
    // Refresh token is dead (expired/revoked) — drop the cookie so middleware
    // stops treating this browser as authenticated.
    const response = NextResponse.json(payload, { status: backendResponse.status });
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
    return response;
  }

  const data = payload as RefreshAuthResponse;
  return NextResponse.json({ accessToken: data.accessToken, expiresIn: data.expiresIn });
}
