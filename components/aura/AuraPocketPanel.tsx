"use client";

import { useEffect, useState } from "react";

type Capability = {
  capability: string;
  state: string;
  provider: string;
  limitations: string[];
};

export function AuraPocketStatus() {
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(typeof navigator !== "undefined" && !navigator.onLine);
    fetch("/api/intelligence/aura/pocket/capabilities?platform=browser")
      .then((r) => r.json())
      .then((d) => setCapabilities(d.capabilities ?? []))
      .catch(() => setCapabilities([]));
  }, []);

  return (
    <section aria-labelledby="pocket-status-heading" className="space-y-4">
      <h2 id="pocket-status-heading" className="text-lg font-semibold">
        AURA Pocket status
      </h2>
      <p role="status">
        Network: {offline ? "Offline — saved missions remain available" : "Online"}
      </p>
      <ul className="list-disc pl-5">
        {capabilities.slice(0, 6).map((c) => (
          <li key={c.capability}>
            {c.capability}: {c.state} ({c.provider})
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AuraInferenceModeSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <fieldset>
      <legend className="font-medium">Inference privacy mode</legend>
      <p className="text-sm text-gray-600">
        You choose how content is processed. This is never inferred from diagnosis.
      </p>
      {(["no_ai", "local_only", "local_preferred", "cloud_allowed"] as const).map(
        (mode) => (
          <label key={mode} className="flex items-center gap-2 py-1">
            <input
              type="radio"
              name="inference-mode"
              value={mode}
              checked={value === mode}
              onChange={() => onChange(mode)}
            />
            {mode.replace(/_/g, " ")}
          </label>
        ),
      )}
    </fieldset>
  );
}

export function AuraOfflineStopControl({
  missionId,
  userId,
  onStopped,
}: {
  missionId: string;
  userId: string;
  onStopped?: () => void;
}) {
  return (
    <button
      type="button"
      className="rounded bg-red-700 px-4 py-2 text-white"
      onClick={async () => {
        const offline = !navigator.onLine;
        const url = offline
          ? "/api/intelligence/aura/pocket/stop"
          : `/api/intelligence/aura/missions/${missionId}/stop`;
        const body = offline
          ? { userId, missionId }
          : { userId };
        await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        onStopped?.();
      }}
    >
      Stop AURA
    </button>
  );
}

export function AuraPresentationModeSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const modes = [
    "standard",
    "plain_language",
    "one_step_at_a_time",
    "large_print",
    "symbol_supported",
  ];
  return (
    <label>
      Presentation mode
      <select
        className="ml-2 border rounded px-2 py-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {modes.map((m) => (
          <option key={m} value={m}>
            {m.replace(/_/g, " ")}
          </option>
        ))}
      </select>
    </label>
  );
}
