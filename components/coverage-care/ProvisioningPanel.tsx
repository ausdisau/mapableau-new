"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { CoverageCareProvisionCheck } from "@/lib/coverage-care/types";

export function ProvisioningPanel({
  checks,
}: {
  checks: CoverageCareProvisionCheck[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function runPreview() {
    setError(null);
    const response = await fetch("/api/coverage-care/provisioning/run", {
      method: "POST",
    });
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Preview failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-8 space-y-4">
      {error ? (
        <p className="text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => void runPreview())}
        className="inline-flex min-h-11 items-center rounded-md bg-[color:var(--cc-olive)] px-4 text-white disabled:opacity-60 focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
      >
        Run domain-readiness preview
      </button>
      <ul className="space-y-3" aria-label="Provisioning checks">
        {checks.map((check) => (
          <li
            key={check.id}
            className="rounded-md border border-[color:var(--cc-sage)]/25 bg-white p-4"
          >
            <p className="font-medium text-[color:var(--cc-olive)]">
              {check.label}{" "}
              <span className="text-sm font-semibold uppercase tracking-wide">
                [{check.status}]
              </span>
            </p>
            <p className="mt-2 text-sm text-[color:var(--cc-ink)]/80">
              {check.detail}
            </p>
          </li>
        ))}
      </ul>
      {checks.length === 0 ? (
        <p className="text-[color:var(--cc-ink)]/75" role="status">
          No preview run yet.
        </p>
      ) : null}
    </div>
  );
}
