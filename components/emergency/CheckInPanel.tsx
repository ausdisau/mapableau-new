"use client";

import { useState } from "react";

export function CheckInPanel() {
  const [message, setMessage] = useState("");
  const [shareLocation, setShareLocation] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function checkIn(checkStatus: "safe" | "need_help") {
    setLoading(true);
    setStatus(null);
    let latitude: number | undefined;
    let longitude: number | undefined;
    if (shareLocation && typeof navigator !== "undefined" && navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 8000,
          }),
        );
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      } catch {
        setStatus("Could not read location. Check-in sent without GPS.");
      }
    }
    const res = await fetch("/api/emergency/check-ins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: checkStatus,
        message: message || undefined,
        latitude,
        longitude,
        shareLocation,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setStatus(data.error ?? "Check-in failed");
      return;
    }
    if (checkStatus === "need_help") {
      setStatus(
        `${data.call000Guidance ?? "Call 000 if in immediate danger."} Trusted contacts will be prompted to reach you.`,
      );
    } else {
      setStatus("Thanks — your safe check-in was recorded.");
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6 space-y-4">
      <h2 className="font-heading text-xl font-bold">Emergency check-in</h2>
      <p className="text-sm text-muted-foreground">
        Let your trusted contacts know you are safe, or ask for help. MapAble does
        not call emergency services for you.
      </p>
      <label htmlFor="checkin-msg" className="block text-sm font-medium">
        Optional message
      </label>
      <textarea
        id="checkin-msg"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={2}
        className="w-full rounded-lg border border-border px-3 py-2 text-sm"
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={shareLocation}
          onChange={(e) => setShareLocation(e.target.checked)}
        />
        Share my location with this check-in (optional)
      </label>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => checkIn("safe")}
          className="min-h-12 min-w-[140px] rounded-lg bg-primary px-6 font-medium text-primary-foreground disabled:opacity-50"
        >
          I&apos;m safe
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => checkIn("need_help")}
          className="min-h-12 min-w-[140px] rounded-lg border-2 border-red-600 bg-red-600 px-6 font-medium text-white disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring"
        >
          I need help
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Immediate danger? Call <strong>000</strong> (Australia) first.
      </p>
      {status ? (
        <p role="status" className="text-sm">
          {status}
        </p>
      ) : null}
    </section>
  );
}
