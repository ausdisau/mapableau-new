"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AccessVerificationActions({
  targetType,
  targetId,
}: {
  targetType: "review" | "alert" | "place_feature";
  targetId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function verify(
    action: "confirm" | "outdated" | "dispute" | "resolve"
  ) {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/access/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId, action }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(typeof j.error === "string" ? j.error : "Could not submit");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Community verification</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="min-h-11 rounded-lg border px-4 text-sm"
          disabled={busy}
          onClick={() => verify("confirm")}
        >
          Confirm
        </button>
        <button
          type="button"
          className="min-h-11 rounded-lg border px-4 text-sm"
          disabled={busy}
          onClick={() => verify("outdated")}
        >
          Outdated
        </button>
        <button
          type="button"
          className="min-h-11 rounded-lg border px-4 text-sm"
          disabled={busy}
          onClick={() => verify("dispute")}
        >
          Dispute
        </button>
        {targetType === "alert" ? (
          <button
            type="button"
            className="min-h-11 rounded-lg border px-4 text-sm"
            disabled={busy}
            onClick={() => verify("resolve")}
          >
            Mark resolved
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
