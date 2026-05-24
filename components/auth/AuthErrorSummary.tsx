import React from "react";

type AuthErrorSummaryProps = {
  errors: string[];
  title?: string;
};

export function AuthErrorSummary({
  errors,
  title = "There is a problem with your sign-in",
}: AuthErrorSummaryProps) {
  if (errors.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground"
    >
      <p className="font-semibold">{title}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </div>
  );
}
