"use client";

import { useEffect, useRef } from "react";

type Props = {
  locationId: string;
};

/**
 * Fires a single widget_view telemetry event for provider ROI tracking.
 * Best-effort only — never blocks the map shell.
 */
export function EmbedWidgetTelemetry({ locationId }: Props) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;

    const payload = JSON.stringify({
      event: "widget_view",
      locationId,
      path: typeof window !== "undefined" ? window.location.pathname : "",
      referrer:
        typeof document !== "undefined" ? document.referrer.slice(0, 500) : "",
      ts: new Date().toISOString(),
    });

    try {
      if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/embed/telemetry", blob);
        return;
      }
    } catch {
      /* fall through to fetch */
    }

    void fetch("/api/embed/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
      credentials: "omit",
    }).catch(() => {
      /* ignore */
    });
  }, [locationId]);

  return null;
}
