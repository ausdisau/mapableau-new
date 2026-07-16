"use client";

import { useEffect, useRef, useState } from "react";

type Options = {
  tripId: string;
  enabled?: boolean;
  pollIntervalMs?: number;
  onStatusChange?: (status: string) => void;
};

/**
 * Transport realtime hook with polling fallback.
 * Authenticated WebSocket transport rooms remain planned until production gates pass.
 */
export function useTransportRealtime({
  tripId,
  enabled = true,
  pollIntervalMs = 15000,
  onStatusChange,
}: Options) {
  const [connectionState, setConnectionState] = useState<
    "polling" | "offline" | "websocket"
  >("polling");
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const prevStatus = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !tripId) return;

    let cancelled = false;

    async function tick() {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setConnectionState("offline");
        setAnnouncement("You are offline. Showing last known trip state.");
        return;
      }
      setConnectionState("polling");
      try {
        const res = await fetch(`/api/transport/trips/${tripId}`);
        if (!res.ok) return;
        const data = await res.json();
        const next = data.trip?.status as string | undefined;
        if (!cancelled && next) {
          setLastSyncAt(new Date().toISOString());
          setStatus(next);
          if (prevStatus.current && prevStatus.current !== next) {
            setAnnouncement(`Trip status updated to ${next.replace(/_/g, " ")}`);
            onStatusChange?.(next);
          }
          prevStatus.current = next;
        }
      } catch {
        if (!cancelled) setConnectionState("offline");
      }
    }

    void tick();
    const id = window.setInterval(() => void tick(), pollIntervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [enabled, tripId, pollIntervalMs, onStatusChange]);

  return { connectionState, lastSyncAt, announcement, status };
}
