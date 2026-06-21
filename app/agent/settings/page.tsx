"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type Settings = {
  highContrastMode: boolean;
  largeTouchTargets: boolean;
  reducedMotion: boolean;
  showReasoningSummary: boolean;
};

export default function AgentSettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    highContrastMode: false,
    largeTouchTargets: false,
    reducedMotion: false,
    showReasoningSummary: false,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void fetch("/api/mapable-agent/settings")
      .then((r) => r.json())
      .then((data: { settings?: Settings }) => {
        if (data.settings) setSettings(data.settings);
      });
  }, []);

  useEffect(() => {
    document.documentElement.dataset.contrast = settings.highContrastMode
      ? "high"
      : "default";
    document.documentElement.dataset.motion = settings.reducedMotion
      ? "reduce"
      : "default";
  }, [settings.highContrastMode, settings.reducedMotion]);

  async function save() {
    await fetch("/api/mapable-agent/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaved(true);
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">Agent settings</h1>
      <p className="mt-2 text-slate-600">Accessibility and display preferences.</p>
      <fieldset className="mt-6 space-y-4">
        <legend className="sr-only">Accessibility options</legend>
        {(
          [
            ["highContrastMode", "High contrast mode"],
            ["largeTouchTargets", "Large touch targets"],
            ["reducedMotion", "Reduced motion"],
            ["showReasoningSummary", "Show short reasoning summaries"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex min-h-11 items-center gap-3">
            <input
              type="checkbox"
              checked={settings[key]}
              onChange={(e) =>
                setSettings((s) => ({ ...s, [key]: e.target.checked }))
              }
              className="h-5 w-5"
            />
            {label}
          </label>
        ))}
      </fieldset>
      <Button type="button" variant="default" size="default" className="mt-6 min-h-11" onClick={() => void save()}>
        Save settings
      </Button>
      {saved ? (
        <p role="status" className="mt-2 text-sm text-green-700">
          Settings saved.
        </p>
      ) : null}
    </>
  );
}
