"use client";

import { useEffect, useRef } from "react";

import { GPT_SCRIPT_SRC } from "@/lib/ads/providers/google-ad-manager/google-ad-manager-adapter";

type GptSlot = { getSlotElementId: () => string };

type GoogleTag = {
  cmd: Array<() => void>;
  apiReady?: boolean;
  defineSlot: (
    path: string,
    size: number[] | number[][],
    elementId: string,
  ) => { addService: (s: unknown) => unknown } | null;
  destroySlots: (slots?: unknown[]) => boolean;
  display: (elementId: string) => void;
  enableServices: () => void;
  pubads: () => {
    enableSingleRequest: () => void;
    setPrivacySettings: (settings: {
      limitedAds?: boolean;
      nonPersonalizedAds?: boolean;
    }) => void;
    getSlots: () => GptSlot[];
  };
};

function getGoogletag(): GoogleTag {
  const w = window as Window & { googletag?: GoogleTag };
  if (!w.googletag) {
    w.googletag = { cmd: [] } as unknown as GoogleTag;
  }
  return w.googletag;
}

let gptLoadPromise: Promise<void> | null = null;

function loadGptOnce(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const g = getGoogletag();
  if (g.apiReady) return Promise.resolve();
  if (gptLoadPromise) return gptLoadPromise;

  gptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GPT_SCRIPT_SRC}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = GPT_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("gpt_load_failed"));
    document.head.appendChild(script);
  });

  return gptLoadPromise;
}

/**
 * Hook: define/display a GAM slot once; destroy on unmount (SPA-safe).
 * Failures (ad blocker, network) never throw into MapAble UI.
 */
export function useGoogleAdManager(options: {
  enabled: boolean;
  elementId: string;
  adUnitPath: string;
  sizes?: number[][];
}) {
  const slotRef = useRef<unknown>(null);

  useEffect(() => {
    if (!options.enabled || !options.adUnitPath) return;

    let cancelled = false;

    void loadGptOnce()
      .then(() => {
        if (cancelled) return;
        const googletag = getGoogletag();
        googletag.cmd.push(() => {
          const existing = googletag
            .pubads()
            .getSlots()
            .find((s) => s.getSlotElementId() === options.elementId);
          if (existing) {
            googletag.destroySlots([existing]);
          }

          googletag.pubads().setPrivacySettings({
            limitedAds: true,
            nonPersonalizedAds: true,
          });

          const slot = googletag.defineSlot(
            options.adUnitPath,
            options.sizes ?? [
              [300, 250],
              [320, 50],
            ],
            options.elementId,
          );
          if (!slot) return;
          slot.addService(googletag.pubads());
          googletag.enableServices();
          googletag.display(options.elementId);
          slotRef.current = slot;
        });
      })
      .catch(() => {
        /* MapAble continues */
      });

    return () => {
      cancelled = true;
      const googletag = getGoogletag();
      if (slotRef.current) {
        googletag.cmd.push(() => {
          googletag.destroySlots([slotRef.current]);
          slotRef.current = null;
        });
      }
    };
  }, [options.enabled, options.elementId, options.adUnitPath, options.sizes]);
}
