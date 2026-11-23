"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { phase3Config } from "@/lib/config/phase3";
import {
  createTransportScheduleSocketSubscription,
  TRANSPORT_SCHEDULE_POLL_MS,
} from "@/lib/realtime/transport-schedule-socket-adapter";

export type TransportSocketConnectionState =
  | "CONNECTING"
  | "CONNECTED"
  | "POLLING_FALLBACK"
  | "DISCONNECTED";

export type VehicleTelemetry = {
  lat: number;
  lng: number;
  heading?: number;
  etaSeconds?: number;
  status?: string;
} | null;

type Options = {
  tripId?: string;
  organisationId?: string;
  /** When false, never attempt live socket / GPS (default). */
  liveTrackingEnabled?: boolean;
};

/** Initial connection state when the hook mounts (no GPS publish). */
export function initialTransportSocketState(
  liveTrackingEnabled: boolean
): TransportSocketConnectionState {
  return liveTrackingEnabled ? "CONNECTING" : "DISCONNECTED";
}

/** Boarding notify is gated; returns not_enabled until a later PR. */
export function boardingAlertNotEnabledMessage(
  liveTrackingEnabled: boolean
): { ok: false; reason: "not_enabled"; message: string } {
  if (!liveTrackingEnabled) {
    return {
      ok: false,
      reason: "not_enabled",
      message: "Boarding assist notify is not enabled in this pilot.",
    };
  }
  return {
    ok: false,
    reason: "not_enabled",
    message:
      "Boarding assist notify requires a later gated release — not wired.",
  };
}

/**
 * Typed OpenSocket client hook for transport booking telemetry.
 * GPS / live publish remain off unless TRANSPORT_LIVE_TRACKING_ENABLED is true.
 * Degrades to POLLING_FALLBACK when the socket adapter is unavailable.
 */
export function useTransportSocket(options: Options = {}) {
  const liveTrackingEnabled =
    options.liveTrackingEnabled ?? phase3Config.transportLiveTrackingEnabled;

  const [connectionState, setConnectionState] =
    useState<TransportSocketConnectionState>(() =>
      initialTransportSocketState(liveTrackingEnabled)
    );
  const [vehicleTelemetry, setVehicleTelemetry] =
    useState<VehicleTelemetry>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    if (!liveTrackingEnabled) {
      setConnectionState("DISCONNECTED");
      setVehicleTelemetry(null);
      return;
    }

    setConnectionState("CONNECTING");
    let cancelled = false;
    let pollId: number | undefined;

    async function start() {
      try {
        const res = await fetch("/api/realtime/socket-token", { method: "POST" });
        if (!res.ok) {
          if (!cancelled) {
            setConnectionState("POLLING_FALLBACK");
            setLastError("Socket auth unavailable — using poll fallback.");
          }
          return;
        }
        const { token } = (await res.json()) as { token?: string };
        if (!token || cancelled) {
          if (!cancelled) setConnectionState("POLLING_FALLBACK");
          return;
        }

        // Phase 1 adapter is intentionally a no-op until socket.io-client is wired
        // for transport — force polling fallback and never invent GPS.
        const unsub = createTransportScheduleSocketSubscription({
          organisationId: options.organisationId ?? "self",
          authToken: token,
          lastSequence: 0,
          onEvent: () => undefined,
          onSequenceGap: () => undefined,
          onDisconnect: () => {
            if (!cancelled) setConnectionState("POLLING_FALLBACK");
          },
        });

        if (!cancelled) {
          setConnectionState("POLLING_FALLBACK");
          setVehicleTelemetry(null);
        }

        pollId = window.setInterval(() => {
          // Placeholder poll tick — no precise location fetch in this scaffold.
          void options.tripId;
        }, TRANSPORT_SCHEDULE_POLL_MS);

        return unsub;
      } catch {
        if (!cancelled) {
          setConnectionState("POLLING_FALLBACK");
          setLastError("Realtime unavailable.");
        }
        return () => undefined;
      }
    }

    let cleanup: (() => void) | undefined;
    void start().then((unsub) => {
      cleanup = unsub;
    });

    return () => {
      cancelled = true;
      cleanup?.();
      if (pollId) window.clearInterval(pollId);
    };
  }, [
    liveTrackingEnabled,
    options.organisationId,
    options.tripId,
  ]);

  const sendBoardingAlert = useCallback(
    async (_payload?: { message?: string }) => {
      void _payload;
      return boardingAlertNotEnabledMessage(liveTrackingEnabled);
    },
    [liveTrackingEnabled]
  );

  return useMemo(
    () => ({
      connectionState,
      vehicleTelemetry,
      liveTrackingEnabled,
      lastError,
      sendBoardingAlert,
    }),
    [
      connectionState,
      vehicleTelemetry,
      liveTrackingEnabled,
      lastError,
      sendBoardingAlert,
    ]
  );
}
