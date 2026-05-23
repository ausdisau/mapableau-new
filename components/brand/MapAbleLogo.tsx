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
        className="relative flex h-10 w-10 shrink-0 items-center justify-center"
        aria-hidden
      >
        <span className="absolute left-0 top-1 h-5 w-5 rounded-full bg-primary/90 shadow-sm" />
        <span className="absolute right-0 top-0 h-5 w-5 rounded-full bg-secondary/90 shadow-sm" />
        <span className="absolute bottom-0 left-2 h-5 w-5 rounded-full bg-amber-400/90 shadow-sm" />
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
