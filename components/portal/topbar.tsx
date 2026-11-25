"use client";

import { Bell, ChevronDown, LogOut, Settings, User } from "lucide-react";
import { GlobalSearch } from "@/components/portal/global-search";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/auth-context";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function Topbar() {
  const { enterpriseProfile, logout } = useAuth();
  const companyName = enterpriseProfile?.companyName ?? "Loading…";
  const unreadCount = 0; // Notifications aren't wired up yet.

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6">
      <div className="flex-1">
        <GlobalSearch />
      </div>

      <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
        <Bell className="size-4.5" />
        {unreadCount > 0 && (
          <Badge className="absolute -right-1 -top-1 size-4 justify-center rounded-full p-0 text-[10px]">
            {unreadCount}
          </Badge>
        )}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 px-2">
            <Avatar className="size-7">
              <AvatarFallback>{initials(companyName)}</AvatarFallback>
            </Avatar>
            <span className="hidden max-w-[12rem] truncate text-sm font-medium sm:inline">
              {companyName}
            </span>
            <ChevronDown className="size-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="truncate">{companyName}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="size-4" />
            Company profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="size-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => void logout()}>
            <LogOut className="size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
