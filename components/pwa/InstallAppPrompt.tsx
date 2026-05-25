"use client";

import { Download, X } from "lucide-react";

import { useInstallPrompt } from "@/lib/hooks/useInstallPrompt";

export function InstallAppPrompt() {
  const { canInstall, promptInstall, dismiss } = useInstallPrompt();

  if (!canInstall) return null;

  return (
    <div
      role="region"
      aria-label="Install MapAble app"
      className="border-b border-border bg-accent px-4 py-3"
    >
      <div className="mx-auto flex max-w-6xl items-start gap-3">
        <Download className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Install MapAble on your device</p>
          <p className="text-sm text-muted-foreground">
            Quick access to bookings, messages and transport from your home
            screen.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              className="min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
              onClick={() => void promptInstall()}
            >
              Install app
            </button>
            <button
              type="button"
              className="min-h-11 rounded-lg border border-border px-4 text-sm font-medium"
              onClick={dismiss}
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          className="min-h-11 min-w-11 rounded-lg p-2 hover:bg-muted"
          aria-label="Dismiss install prompt"
          onClick={dismiss}
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
