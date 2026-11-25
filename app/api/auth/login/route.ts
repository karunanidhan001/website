import { NextResponse } from "next/server";
import {
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/auth/cookies";
import type { EnterpriseLoginRequest, EnterpriseLoginResponse } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export async function POST(request: Request) {
  let body: EnterpriseLoginRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body?.email || !body?.password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/enterprise/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: body.email, password: body.password }),
    });
  } catch {
    return NextResponse.json({ error: "Can't reach the server" }, { status: 502 });
  }

  const payload = await backendResponse.json().catch(() => ({}));

  if (!backendResponse.ok) {
    return NextResponse.json(payload, { status: backendResponse.status });
  }

  const data = payload as EnterpriseLoginResponse;
  const { refreshToken, ...clientSafe } = data;

  const response = NextResponse.json(clientSafe);
  response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE_SECONDS,
  });
  return response;
}
