import * as React from "react";

import { cn } from "../lib/cn";
import { Button } from "../primitives/button";

export interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  linkComponent?: React.ElementType;
  className?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  linkComponent: LinkComponent,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6",
        className,
      )}
      data-testid="mapable-empty-state"
    >
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {description ? (
        <p className="mt-2 text-sm text-slate-600">{description}</p>
      ) : null}
      {children}
      {actionLabel && onAction ? (
        <Button
          type="button"
          variant="brand"
          className="mt-4"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      ) : null}
      {actionLabel && actionHref && LinkComponent ? (
        <Button variant="brand" className="mt-4" asChild>
          <LinkComponent href={actionHref}>{actionLabel}</LinkComponent>
        </Button>
      ) : null}
    </div>
  );
}
