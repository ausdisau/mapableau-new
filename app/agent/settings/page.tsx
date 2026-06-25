"use client";

import { useEffect, useState } from "react";

import {
  AccessibilitySettingsPanel,
  type AccessibilitySettings,
} from "@/components/mapable-agent/AccessibilitySettingsPanel";

export default function AgentSettingsPage() {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrastMode: false,
    largeTouchTargets: false,
    reducedMotion: false,
    showReasoningSummary: false,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void fetch("/api/mapable-agent/settings")
      .then((r) => r.json())
      .then((data: { settings?: AccessibilitySettings }) => {
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
      <AccessibilitySettingsPanel
        settings={settings}
        onChange={setSettings}
        onSave={() => void save()}
        saved={saved}
      />
    </>
  );
}
