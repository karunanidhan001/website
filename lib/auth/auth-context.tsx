"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiRequest } from "@/lib/api";
import type { EnterpriseLoginResponse, EnterpriseProfile } from "@/lib/types";
import { decodeJwtExpiryMs } from "@/lib/auth/jwt";

type SessionStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: SessionStatus;
  accessToken: string | null;
  enterpriseProfile: EnterpriseProfile | null;
  setEnterpriseProfile: (profile: EnterpriseProfile) => void;
  login: (email: string, password: string) => Promise<EnterpriseLoginResponse>;
  logout: () => Promise<void>;
  /** Authenticated fetch: attaches the in-memory access token, retries once after a silent refresh on 401. */
  authFetch: <T>(path: string, options?: Parameters<typeof apiRequest>[1]) => Promise<T>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Refresh this many ms before the access token's declared expiry.
const REFRESH_SKEW_MS = 60_000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [enterpriseProfile, setEnterpriseProfileState] = useState<EnterpriseProfile | null>(null);

  const accessTokenRef = useRef<string | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshInFlightRef = useRef<Promise<string | null> | null>(null);
  // Indirection so the refresh timer always calls the latest refreshSession
  // without scheduleRefresh needing refreshSession as a dependency (and
  // without relying on closure-execution-order to resolve it correctly).
  const refreshSessionRef = useRef<() => Promise<string | null>>(async () => null);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const setAccessToken = useCallback((token: string | null) => {
    accessTokenRef.current = token;
    setAccessTokenState(token);
  }, []);

  const scheduleRefresh = useCallback(
    (token: string) => {
      clearRefreshTimer();
      const expiryMs = decodeJwtExpiryMs(token);
      if (!expiryMs) return;
      const delay = Math.max(expiryMs - Date.now() - REFRESH_SKEW_MS, 5_000);
      refreshTimerRef.current = setTimeout(() => {
        void refreshSessionRef.current();
      }, delay);
    },
    [clearRefreshTimer],
  );

  const refreshSession = useCallback(async (): Promise<string | null> => {
    if (refreshInFlightRef.current) return refreshInFlightRef.current;

    const attempt = (async () => {
      try {
        const data = await apiRequest<{ accessToken: string }>("/api/auth/refresh", {
          method: "POST",
        });
        setAccessToken(data.accessToken);
        scheduleRefresh(data.accessToken);
        setStatus("authenticated");
        return data.accessToken;
      } catch {
        setAccessToken(null);
        setEnterpriseProfileState(null);
        setStatus("unauthenticated");
        return null;
      } finally {
        refreshInFlightRef.current = null;
      }
    })();

    refreshInFlightRef.current = attempt;
    return attempt;
  }, [scheduleRefresh, setAccessToken]);

  useEffect(() => {
    refreshSessionRef.current = refreshSession;
  }, [refreshSession]);

  const login = useCallback(
    async (email: string, password: string): Promise<EnterpriseLoginResponse> => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new ApiError(body.error ?? "Login failed", response.status, body.code, body);
      }
      const data = body as EnterpriseLoginResponse;
      setAccessToken(data.accessToken);
      setEnterpriseProfileState(data.enterpriseProfile);
      scheduleRefresh(data.accessToken);
      setStatus("authenticated");
      return data;
    },
    [scheduleRefresh, setAccessToken],
  );

  const logout = useCallback(async () => {
    clearRefreshTimer();
    setAccessToken(null);
    setEnterpriseProfileState(null);
    setStatus("unauthenticated");
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
    }
  }, [clearRefreshTimer, router, setAccessToken]);

  const authFetch = useCallback(
    async <T,>(path: string, options?: Parameters<typeof apiRequest>[1]): Promise<T> => {
      const run = (token: string | null) =>
        apiRequest<T>(path, { ...options, accessToken: token ?? undefined });

      try {
        return await run(accessTokenRef.current);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          const refreshed = await refreshSession();
          if (refreshed) {
            return run(refreshed);
          }
          await logout();
        }
        throw error;
      }
    },
    [logout, refreshSession],
  );

  // On mount: the access token is memory-only and lost on every reload, so
  // silently exchange the httpOnly refresh cookie (if any) for a fresh one.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const token = await refreshSession();
      if (cancelled || !token) return;
      try {
        const me = await apiRequest<{ enterpriseProfile: EnterpriseProfile }>("/enterprise/me", {
          accessToken: token,
        });
        if (!cancelled) setEnterpriseProfileState(me.enterpriseProfile);
      } catch {
        // Profile fetch failing doesn't invalidate the session — pages that
        // need the profile will re-fetch it themselves.
      }
    })();
    return () => {
      cancelled = true;
    };
    // Intentionally run once on mount; refreshSession is re-captured via
    // refreshSessionRef for the timer path and re-invoked directly here only
    // for the initial silent restore.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => clearRefreshTimer, [clearRefreshTimer]);

  const setEnterpriseProfile = useCallback((profile: EnterpriseProfile) => {
    setEnterpriseProfileState(profile);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        status,
        accessToken,
        enterpriseProfile,
        setEnterpriseProfile,
        login,
        logout,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
