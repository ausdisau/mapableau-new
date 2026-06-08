"use client";

import { cn } from "@/app/lib/utils";

type StatusMessageProps = {
  variant: "info" | "success" | "error";
  message: string;
  className?: string;
  onDismiss?: () => void;
};

const variantStyles = {
  info: "border-border bg-muted/50 text-foreground",
  success: "border-primary/20 bg-primary/5 text-foreground",
  error: "border-destructive/30 bg-destructive/5 text-destructive",
} as const;

export function StatusMessage({
  variant,
  message,
  className,
  onDismiss,
}: StatusMessageProps) {
  const isError = variant === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={cn(
        "rounded-lg border p-4 text-sm",
        variantStyles[variant],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p>{message}</p>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded-md px-2 py-1 text-xs font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Dismiss
          </button>
        ) : null}
      </div>
    </div>
  );
}
