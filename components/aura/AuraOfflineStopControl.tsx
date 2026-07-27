"use client";

import { useState } from "react";

type Props = {
  missionId: string;
  snapshotId?: string;
  onStopped?: () => void;
  onError?: (message: string) => void;
};

/**
 * Offline/online Stop AURA control.
 * Only signals UI termination after a successful fetch status (2xx).
 */
export function AuraOfflineStopControl({
  missionId,
  snapshotId,
  onStopped,
  onError,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <button
        type="button"
        className="rounded bg-red-700 px-4 py-2 text-white disabled:opacity-50"
        disabled={busy}
        aria-busy={busy}
        onClick={async () => {
          setBusy(true);
          setStatusMessage(null);
          try {
            const offline =
              typeof navigator !== "undefined" && !navigator.onLine;
            const url = offline
              ? "/api/intelligence/aura/pocket/stop"
              : `/api/intelligence/aura/missions/${encodeURIComponent(missionId)}/stop`;
            const body = offline
              ? { missionId, snapshotId }
              : { snapshotId };

            const res = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });

            // Resilience: verify status before signalling mission termination in UI.
            if (!res.ok) {
              const payload = (await res.json().catch(() => null)) as {
                error?: string;
                message?: string;
              } | null;
              const message =
                payload?.error ??
                payload?.message ??
                `Stop failed (${res.status})`;
              setStatusMessage(message);
              onError?.(message);
              return;
            }

            setStatusMessage("Stop AURA requested");
            onStopped?.();
          } catch {
            const message = "Stop request failed — check connection and retry";
            setStatusMessage(message);
            onError?.(message);
          } finally {
            setBusy(false);
          }
        }}
      >
        Stop AURA
      </button>
      {statusMessage ? (
        <p role="status" className="text-sm">
          {statusMessage}
        </p>
      ) : null}
    </div>
  );
}
