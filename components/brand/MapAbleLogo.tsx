import { MapPin } from "lucide-react";
import Link from "next/link";

import { cn } from "@/app/lib/utils";

export function MapAbleLogo({
  href = "/",
  title = "MapAble",
  subtitle,
  className,
}: {
  href?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-xl outline-none ring-offset-background transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-dashed border-primary/35 bg-gradient-to-br from-card via-card to-primary/5"
        aria-hidden
      >
        <MapPin className="h-5 w-5 text-primary" aria-hidden />
      </span>
      <span className="min-w-0 truncate font-heading text-lg font-bold tracking-tight text-foreground">
        {title}
        {subtitle ? (
          <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">
            {subtitle}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
