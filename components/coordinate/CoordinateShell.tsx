"use client";

import type { ReactNode } from "react";

import { COORDINATE_REASSURANCE } from "@/lib/coordinate/types";

export function CoordinatePageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="space-y-2">
      <h1 className="font-heading text-2xl font-bold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">
        {description ?? COORDINATE_REASSURANCE}
      </p>
    </header>
  );
}

export function CoordinateAiDisclaimer({
  confidence,
  reason,
  className = "",
}: {
  confidence?: number | null;
  reason?: string | null;
  className?: string;
}) {
  const label =
    confidence == null
      ? "AI suggested · needs your approval"
      : confidence >= 0.65
        ? `Moderate confidence (${Math.round(confidence * 100)}%) · review recommended`
        : `Low confidence (${Math.round(confidence * 100)}%) · human review required`;

  return (
    <div
      className={`rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100 ${className}`}
      role="note"
      aria-label={label}
    >
      <p className="font-medium">AI suggested · needs your approval</p>
      <p className="mt-1 text-xs opacity-90">{label}</p>
      {reason ? (
        <details className="mt-2">
          <summary className="cursor-pointer font-medium">Why this?</summary>
          <p className="mt-2 text-xs leading-relaxed">{reason}</p>
        </details>
      ) : null}
    </div>
  );
}

export function CoordinateConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="coordinate-confirm-title"
    >
      <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-lg">
        <h2 id="coordinate-confirm-title" className="text-lg font-semibold">
          {title}
        </h2>
        <div className="mt-2 text-sm text-muted-foreground">{description}</div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="min-h-11 rounded-md border px-4 text-sm font-medium"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="min-h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
