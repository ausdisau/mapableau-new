"use client";

import { Download, X } from "lucide-react";
import { useState } from "react";

import { useInstallPrompt } from "@/hooks/useInstallPrompt";

export function InstallAppPrompt() {
  const { canInstall, promptInstall, dismissPrompt, isInstalled } =
    useInstallPrompt();
  const [busy, setBusy] = useState(false);

  if (!canInstall || isInstalled) return null;

  async function handleInstall() {
    setBusy(true);
    try {
      await promptInstall();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[90] border-t border-border bg-card px-4 py-3 shadow-lg"
      style={{
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
      }}
      role="region"
      aria-label="Install MapAble app"
    >
      <div className="mx-auto flex max-w-lg items-start gap-3">
        <Download className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            Install MapAble
          </p>
          <p className="text-sm text-muted-foreground">
            Add MapAble to your home screen for quick access to bookings and
            messages.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleInstall}
              disabled={busy}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "Installing…" : "Install"}
            </button>
            <button
              type="button"
              onClick={dismissPrompt}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismissPrompt}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
          aria-label="Dismiss install prompt"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
