import * as React from "react";

import { cn } from "../lib/cn";

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  title: string;
  titleId?: string;
  description?: string;
  action?: React.ReactNode;
}

export function Section({
  title,
  titleId,
  description,
  action,
  className,
  children,
  ...props
}: SectionProps) {
  const id = titleId ?? `${title.toLowerCase().replace(/\s+/g, "-")}-heading`;

  return (
    <section
      aria-labelledby={id}
      className={cn(className)}
      data-testid="mapable-section"
      {...props}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id={id} className="text-xl font-bold text-[#0C1833]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
