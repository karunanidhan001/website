"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * middleware.ts only checks whether the refresh-token cookie is present, not
 * whether it's still valid — an expired/revoked refresh token would otherwise
 * render the portal shell with no access token. This catches that case once
 * AuthProvider's mount-time silent refresh resolves.
 */
export function PortalGate({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="size-10 rounded-card" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
