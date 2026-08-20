"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type CreativeRow = {
  id: string;
  headline: string;
  status: string;
  claimFlags: string[];
};

export function CampaignCreativeActions({
  creatives,
}: {
  creatives: CreativeRow[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/ads/manager/creatives/${id}/submit`, {
        method: "POST",
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? "Submit failed");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="space-y-2">
        {creatives.map((c) => (
          <li
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded border border-border p-3"
          >
            <div>
              <p className="font-medium">{c.headline}</p>
              <p className="text-xs text-muted-foreground">
                {c.status}
                {c.claimFlags.length
                  ? ` · flags: ${c.claimFlags.join(", ")}`
                  : ""}
              </p>
            </div>
            {c.status === "DRAFT" || c.status === "REJECTED" ? (
              <button
                type="button"
                className="min-h-11 rounded bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                disabled={busyId === c.id}
                onClick={() => void submit(c.id)}
              >
                {busyId === c.id ? "Submitting…" : "Submit for review"}
              </button>
            ) : (
              <span className="text-xs text-muted-foreground">
                Awaiting MapAble
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
