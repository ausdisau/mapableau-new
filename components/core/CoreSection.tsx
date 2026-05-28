import type { ReactNode } from "react";

import { cn } from "@/app/lib/utils";

export function CoreSection({
  id,
  title,
  description,
  children,
  className,
}: {
  id?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  const headingId = id ? `${id}-heading` : undefined;

  return (
    <section
      id={id}
      className={cn("scroll-mt-24", className)}
      aria-labelledby={headingId}
    >
      <div className="space-y-1">
        <h2
          id={headingId}
          className="font-heading text-xl font-semibold tracking-tight"
        >
          {title}
        </h2>
        {description ? (
          <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">{description}</p>
        ) : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
