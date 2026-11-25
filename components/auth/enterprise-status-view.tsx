"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Ban,
  Clock,
  Mail,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import type { ApprovalStatus, EnterpriseMeResponse } from "@/lib/types";

interface StatusCopy {
  icon: LucideIcon;
  title: string;
  description: string;
}

const STATUS_COPY: Record<ApprovalStatus, StatusCopy> = {
  EMAIL_PENDING: {
    icon: Mail,
    title: "Verify your company email",
    description:
      "We've sent a confirmation code to your company email address. Confirm it to continue registration.",
  },
  PENDING_APPROVAL: {
    icon: Clock,
    title: "Pending approval",
    description: "Your enterprise registration is complete and waiting for an administrator to review it.",
  },
  REJECTED: {
    icon: ShieldAlert,
    title: "Registration rejected",
    description: "An administrator rejected this registration.",
  },
  SUSPENDED: {
    icon: Ban,
    title: "Account suspended",
    description: "This enterprise account has been suspended by an administrator.",
  },
  ACTIVE: {
    icon: ShieldCheck,
    title: "Account active",
    description: "Your account is active.",
  },
};

export function EnterpriseStatusView() {
  const router = useRouter();
  const { authFetch, setEnterpriseProfile, logout } = useAuth();
  const [me, setMe] = useState<EnterpriseMeResponse | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const fresh = await authFetch<EnterpriseMeResponse>("/enterprise/me");
      setMe(fresh);
      setEnterpriseProfile(fresh.enterpriseProfile);
    } catch {
      setLoadError(true);
    }
  }, [authFetch, setEnterpriseProfile]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (me && (me.accessAllowed || me.approvalStatus === "ACTIVE")) {
      router.replace("/dashboard");
    }
  }, [me, router]);

  if (!me) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-card border border-border bg-card p-8">
          {loadError ? (
            <p className="text-center text-sm text-muted-foreground">
              Couldn&apos;t load your account status.{" "}
              <button onClick={() => void load()} className="font-medium text-primary underline">
                Try again
              </button>
            </p>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="size-14 rounded-card" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          )}
        </div>
      </div>
    );
  }

  const copy = STATUS_COPY[me.approvalStatus];
  const Icon = copy.icon;

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-card border border-border bg-card p-8 text-center">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-card bg-gradient-primary">
          <Icon className="size-7 text-white" />
        </div>
        <h1 className="text-xl font-bold text-foreground">{copy.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{me.message || copy.description}</p>

        {me.approvalStatus === "REJECTED" && me.enterpriseProfile.rejectionReason && (
          <p className="mt-4 rounded-input bg-danger/10 px-3 py-2 text-left text-sm text-danger">
            <span className="font-medium">Reason: </span>
            {me.enterpriseProfile.rejectionReason}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <Button variant="outline" onClick={() => void refresh()} disabled={refreshing} className="rounded-button">
            <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Checking…" : "Check status"}
          </Button>
          <Button variant="ghost" onClick={() => void logout()} className="rounded-button">
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
