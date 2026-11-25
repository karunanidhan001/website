"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { NAV_ITEMS } from "@/lib/nav";
import { useRouter } from "next/navigation";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full max-w-sm items-center gap-2 rounded-input border border-border bg-surface-variant px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 text-left">Search assets, claims, customers…</span>
        <kbd className="hidden rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
          ⌘K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search assets, claims, customers…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Go to">
            {NAV_ITEMS.map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => {
                  setOpen(false);
                  router.push(item.href);
                }}
              >
                <item.icon className="size-4" />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
