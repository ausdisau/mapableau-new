import type { ReactNode } from "react";

import { cn } from "@/app/lib/utils";
import { mapableSectionCardClass } from "@/lib/brand/styles";

export function CoreRecordCard({
  title,
  meta,
  children,
  className,
}: {
  title: ReactNode;
  meta?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <article className={cn(mapableSectionCardClass, "p-4 sm:p-5", className)}>
      <header className="space-y-1">
        <h2 className="font-heading text-lg font-semibold leading-snug">{title}</h2>
        {meta ? (
          <p className="text-xs text-muted-foreground">{meta}</p>
        ) : null}
      </header>
      {children ? <div className="mt-3 text-sm text-foreground">{children}</div> : null}
    </article>
  );
}
