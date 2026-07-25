"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

async function captureTelemetry(): Promise<{
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  timestamp: string;
} | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return null;
  }
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 12_000,
        maximumAge: 30_000,
      });
    });
    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracyMeters: pos.coords.accuracy || 25,
      timestamp: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function WorkerShiftActions({
  shiftId,
  status,
  paceTelemetryEnabled = false,
}: {
  shiftId: string;
  status: string;
  /** When true, attach browser GPS to check-in/out (PACE telemetry scaffold). */
  paceTelemetryEnabled?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const call = async (path: string) => {
    setLoading(true);
    setError("");
    try {
      let body: string | undefined;
      const headers: Record<string, string> = {};
      if (paceTelemetryEnabled) {
        const telemetry = await captureTelemetry();
        if (!telemetry) {
          setError(
            "Location permission is required for PACE telemetry check-in/out."
          );
          setLoading(false);
          return;
        }
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(telemetry);
      }
      const res = await fetch(path, {
        method: "POST",
        headers,
        body,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          typeof data.error === "string" ? data.error : "Request failed"
        );
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {(status === "scheduled" ||
          status === "worker_assigned" ||
          status === "confirmed") && (
          <Button
            type="button"
            variant="default"
            size="default"
            disabled={loading}
            loading={loading}
            onClick={() => void call(`/api/care/shifts/${shiftId}/check-in`)}
          >
            Check in
          </Button>
        )}
        {(status === "checked_in" || status === "in_progress") && (
          <Button
            type="button"
            variant="outline"
            size="default"
            disabled={loading}
            loading={loading}
            onClick={() => void call(`/api/care/shifts/${shiftId}/check-out`)}
          >
            Check out
          </Button>
        )}
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
