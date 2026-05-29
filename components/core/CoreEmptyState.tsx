import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/app/lib/utils";

export function CoreEmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  children,
  className,
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-border/70 bg-muted/20 px-6 py-10 text-center",
        className
      )}
    >
      <h2 className="font-heading text-lg font-semibold">{title}</h2>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      ) : null}
      {children ? <div className="mt-4 text-sm">{children}</div> : null}
      {actionHref && actionLabel ? (
        <p className="mt-4">
          <Link
            href={actionHref}
            className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
          >
            {actionLabel}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
