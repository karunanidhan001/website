// Shared between the auth route handlers and middleware.ts — keep this the one
// place that names the refresh-token cookie.
export const REFRESH_TOKEN_COOKIE = "wa_rt";

// Cognito refresh tokens commonly default to a 30-day validity; the cookie
// itself expiring slightly before that just means we fall back to a normal
// login instead of a silent refresh.
export const REFRESH_TOKEN_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
