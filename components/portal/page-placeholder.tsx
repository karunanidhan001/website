import type { LucideIcon } from "lucide-react";

interface PagePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function PagePlaceholder({ title, description, icon: Icon }: PagePlaceholderProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border bg-card/40 p-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-card bg-gradient-primary">
          <Icon className="size-6 text-white" />
        </div>
        <p className="font-medium text-foreground">Coming soon</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          This section isn&apos;t wired up to live data yet. Check back once the {title.toLowerCase()} workflow ships.
        </p>
      </div>
    </div>
  );
}
