"use client";

import type { TransportSocketConnectionState } from "@/lib/realtime/use-transport-socket";

type Props = {
  liveEnabled: boolean;
  connectionState: TransportSocketConnectionState;
  statusLabel?: string;
  etaLabel?: string;
  onNotifyRampReady?: () => void;
};

/**
 * Step 05 shell — live OpenSocket telemetry.
 * When live tracking is off (default), shows pilot-unavailable copy and disables
 * boarding notify. Does not publish GPS.
 */
export function LiveTripTelemetryBar({
  liveEnabled,
  connectionState,
  statusLabel,
  etaLabel,
  onNotifyRampReady,
}: Props) {
  if (!liveEnabled) {
    return (
      <div
        className="tb-surface flex flex-wrap items-center justify-between gap-3 p-4"
        role="status"
        aria-live="polite"
      >
        <div>
          <p className="font-heading text-sm font-semibold">Live trip status</p>
          <p className="tb-ink-secondary text-sm">
            Live GPS tracking is not available in this pilot. Use your trip
            dashboard for human-updated status, or call{" "}
            <strong className="text-[var(--tb-ink-primary)]">000</strong> in an
            emergency.
          </p>
        </div>
        <button
          type="button"
          className="tb-btn-secondary"
          disabled
          aria-disabled="true"
        >
          Notify driver: ramp ready (unavailable)
        </button>
      </div>
    );
  }

  return (
    <div
      className="tb-surface flex flex-wrap items-center justify-between gap-3 p-4"
      role="status"
      aria-live="polite"
    >
      <div>
        <p className="font-heading text-sm font-semibold">
          Status: {statusLabel ?? "Waiting"}
          {etaLabel ? ` · ${etaLabel}` : ""}
        </p>
        <p className="tb-ink-secondary tb-mono text-xs">
          Connection: {connectionState}
        </p>
      </div>
      <button
        type="button"
        className="tb-btn-primary"
        onClick={onNotifyRampReady}
        disabled={connectionState === "DISCONNECTED"}
      >
        Notify driver: ramp ready
      </button>
    </div>
  );
}
