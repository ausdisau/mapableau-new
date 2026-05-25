"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function PeerPrivacySettingsPanel({
  initialPause,
  initialLockScreenSafe,
}: {
  initialPause: boolean;
  initialLockScreenSafe: boolean;
}) {
  const [pause, setPause] = useState(initialPause);
  const [lockSafe, setLockSafe] = useState(initialLockScreenSafe);
  const [saved, setSaved] = useState(false);

  async function save() {
    await fetch("/api/peer/privacy", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pauseCommunityNotifications: pause,
        lockScreenSafeOnly: lockSafe,
      }),
    });
    setSaved(true);
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <label className="flex min-h-11 items-center gap-3">
        <input
          type="checkbox"
          checked={pause}
          onChange={(e) => setPause(e.target.checked)}
        />
        <span>Pause all MapAble Peer notifications</span>
      </label>
      <label className="flex min-h-11 items-center gap-3">
        <input
          type="checkbox"
          checked={lockSafe}
          onChange={(e) => setLockSafe(e.target.checked)}
        />
        <span>Use privacy-safe notification text on lock screen</span>
      </label>
      <Button type="submit" variant="default" size="default" className="min-h-11">
        Save privacy settings
      </Button>
      {saved ? (
        <p className="text-sm text-muted-foreground" role="status">
          Settings saved.
        </p>
      ) : null}
    </form>
  );
}
