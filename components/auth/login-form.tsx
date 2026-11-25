"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/auth-context";
import { classifyAuthError, type AuthErrorInfo } from "@/lib/auth/errors";
import type { EnterpriseMeResponse } from "@/lib/types";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, authFetch, setEnterpriseProfile } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<AuthErrorInfo | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login(email, password);

      // Mirrors EnterpriseStatusActivity's reconciliation call: route strictly
      // off a fresh GET /enterprise/me rather than the login payload alone.
      const me = await authFetch<EnterpriseMeResponse>("/enterprise/me");
      setEnterpriseProfile(me.enterpriseProfile);

      if (me.accessAllowed || me.approvalStatus === "ACTIVE") {
        const next = searchParams.get("next");
        router.replace(next && next.startsWith("/") ? next : "/dashboard");
      } else {
        router.replace("/enterprise/status");
      }
    } catch (err) {
      setError(classifyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-card border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-card bg-gradient-primary">
            <ShieldCheck className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">WarAunty for Business</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to your enterprise account</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Company email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ops@example.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-input bg-danger/10 px-3 py-2 text-sm text-danger">
              {error.message}
            </p>
          )}

          <Button type="submit" disabled={submitting} className="mt-2 w-full rounded-button">
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
