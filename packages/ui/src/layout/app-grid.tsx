import * as React from "react";

import { cn } from "../lib/cn";

export interface AppGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3 | 4;
}

const columnClasses: Record<NonNullable<AppGridProps["columns"]>, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

export function AppGrid({
  columns = 3,
  className,
  children,
  ...props
}: AppGridProps) {
  return (
    <div
      className={cn("grid gap-4", columnClasses[columns], className)}
      data-testid="mapable-app-grid"
      {...props}
    >
      {children}
    </div>
  );
}
