import { ApiError } from "@/lib/api";

export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "NOT_CONFIRMED"
  | "TOO_MANY_REQUESTS"
  | "NETWORK"
  | "SERVER";

export interface AuthErrorInfo {
  code: AuthErrorCode;
  message: string;
}

/**
 * Backend auth errors are untyped Cognito-derived messages (see normalizeError()
 * in backend/lambda/index.js) — classify by status + message text, mirroring the
 * Android app's AuthException taxonomy, for consistent, friendly UI copy.
 */
export function classifyAuthError(error: unknown): AuthErrorInfo {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return { code: "NETWORK", message: "Can't reach the server. Check your connection and try again." };
    }
    if (error.status === 429) {
      return { code: "TOO_MANY_REQUESTS", message: "Too many attempts. Wait a moment and try again." };
    }
    if (/not\s+confirmed/i.test(error.message)) {
      return {
        code: "NOT_CONFIRMED",
        message: "This account's email hasn't been verified yet. Check your inbox for a confirmation code.",
      };
    }
    if (error.status === 401) {
      return { code: "INVALID_CREDENTIALS", message: "Incorrect email or password." };
    }
    if (error.status >= 500) {
      return { code: "SERVER", message: "Something went wrong on our end. Please try again shortly." };
    }
    return { code: "SERVER", message: error.message || "Sign in failed. Please try again." };
  }
  return { code: "NETWORK", message: "Can't reach the server. Check your connection and try again." };
}
