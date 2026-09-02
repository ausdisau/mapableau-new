import type { HTMLAttributes } from "react";

import { cn } from "../lib/cn";

export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-slate-200/80 motion-reduce:animate-none",
        className,
      )}
      aria-hidden="true"
      data-testid="mapable-skeleton"
      {...props}
    />
  );
}
