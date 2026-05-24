import React from "react";

import { cn } from "@/app/lib/utils";

type PlainLanguageStatusBadgeProps = {
  label: string;
  tone?: "neutral" | "active" | "success" | "warning" | "danger";
};

const toneClass: Record<NonNullable<PlainLanguageStatusBadgeProps["tone"]>, string> = {
  neutral: "border-border bg-muted/40 text-foreground",
  active: "border-primary/30 bg-primary/10 text-primary",
  success: "border-secondary/30 bg-secondary/10 text-secondary",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100",
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function PlainLanguageStatusBadge({
  label,
  tone = "neutral",
}: PlainLanguageStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border px-3 py-1 text-sm font-medium",
        toneClass[tone],
      )}
    >
      {label}
    </span>
  );
}
