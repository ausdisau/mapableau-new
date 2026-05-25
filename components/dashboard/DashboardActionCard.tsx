import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/app/lib/utils";

export function DashboardActionCard({
  href,
  title,
  description,
  icon: Icon,
  priority,
  className,
}: {
  href: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  priority?: "default" | "high";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-h-[4.5rem] items-start gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        priority === "high" && "border-primary/30 bg-primary/5",
        className
      )}
    >
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
          priority === "high" ? "bg-primary text-primary-foreground" : "bg-muted text-primary"
        )}
        aria-hidden
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block font-semibold">{title}</span>
        {description ? (
          <span className="mt-0.5 block text-sm text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
