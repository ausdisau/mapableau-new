"use client";

export function DraftStatus({
  message,
  saving = false,
}: {
  message: string;
  saving?: boolean;
}) {
  return (
    <p
      className="text-sm text-slate-600"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-testid="draft-status"
    >
      {saving ? "Saving draft…" : message}
    </p>
  );
}
