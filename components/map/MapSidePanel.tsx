"use client";

import { X } from "lucide-react";

import { cn } from "@/app/lib/utils";
import { Button } from "@/components/ui/button";

type MapSidePanelProps = {
  title: string;
  subtitle?: string;
  badges?: React.ReactNode;
  children?: React.ReactNode;
  onClose?: () => void;
  className?: string;
  liveMessage?: string;
};

export function MapSidePanel({
  title,
  subtitle,
  badges,
  children,
  onClose,
  className,
  liveMessage,
}: MapSidePanelProps) {
  return (
    <aside
      className={cn(
        "absolute right-3 top-3 z-10 max-h-[calc(100%-1.5rem)] w-[min(100%,320px)] overflow-y-auto rounded-xl border border-border/60 bg-card p-4 shadow-lg motion-reduce:transition-none",
        className,
      )}
      aria-label={`Selected map feature: ${title}`}
    >
      {liveMessage ? (
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {liveMessage}
        </div>
      ) : null}
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-base font-semibold">{title}</h3>
          {subtitle ? (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
          {badges ? <div className="mt-2 flex flex-wrap gap-2">{badges}</div> : null}
        </div>
        {onClose ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            aria-label="Close map details panel"
            className="shrink-0"
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        ) : null}
      </div>
      {children ? <div className="mt-4 space-y-3">{children}</div> : null}
    </aside>
  );
}
