// Client-side only reads the token's declared expiry to schedule a proactive
// refresh — no signature verification happens here or anywhere in the browser.
// The backend is the only party that verifies the Cognito JWT.
export function decodeJwtExpiryMs(token: string): number | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const json = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    ) as { exp?: number };
    return typeof json.exp === "number" ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}
