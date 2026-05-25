"use client";

import { useCallback, useEffect, useState } from "react";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export type InstallPromptState = {
  /** Deferred install event from the browser, when available */
  promptEvent: BeforeInstallPromptEvent | null;
  /** User already installed or browser does not offer install */
  isInstalled: boolean;
  canInstall: boolean;
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
  dismissPrompt: () => void;
  isDismissed: boolean;
};

const DISMISS_KEY = "mapable-install-prompt-dismissed";

function readStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    ("standalone" in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

export function useInstallPrompt(): InstallPromptState {
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsInstalled(readStandalone());
    try {
      setIsDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setIsDismissed(false);
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setIsInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!promptEvent) return "unavailable";
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted") {
      setPromptEvent(null);
      setIsInstalled(true);
    }
    return outcome;
  }, [promptEvent]);

  const dismissPrompt = useCallback(() => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore quota */
    }
  }, []);

  return {
    promptEvent,
    isInstalled,
    canInstall: Boolean(promptEvent) && !isInstalled && !isDismissed,
    promptInstall,
    dismissPrompt,
    isDismissed,
  };
}
