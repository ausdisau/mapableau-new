"use client";

import { useEffect, useState } from "react";

type SwUpdateState = "idle" | "available" | "updating";

function isServiceWorkerEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator)) return false;

  const force =
    process.env.NEXT_PUBLIC_PWA_SW_ENABLED === "true" ||
    process.env.NEXT_PUBLIC_PWA_SW_ENABLED === "1";
  if (force) return true;

  if (process.env.NODE_ENV === "development") return false;
  return true;
}

export function ServiceWorkerRegister() {
  const [updateState, setUpdateState] = useState<SwUpdateState>("idle");

  useEffect(() => {
    if (!isServiceWorkerEnabled()) return;

    let registration: ServiceWorkerRegistration | undefined;
    let cancelled = false;

    async function register() {
      try {
        registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        if (cancelled) return;

        registration.addEventListener("updatefound", () => {
          const installing = registration?.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setUpdateState("available");
            }
          });
        });
      } catch (err) {
        console.warn("[MapAble PWA] Service worker registration failed:", err);
      }
    }

    void register();

    return () => {
      cancelled = true;
    };
  }, []);

  async function applyUpdate() {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg?.waiting) return;
    setUpdateState("updating");
    reg.waiting.postMessage({ type: "SKIP_WAITING" });
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  }

  if (updateState === "idle") return null;

  const isUpdating = updateState === "updating";

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-4 right-4 z-[95] mx-auto max-w-md rounded-lg border border-border bg-card p-4 shadow-lg"
      style={{
        marginBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <p className="text-sm font-medium text-foreground">Update available</p>
      <p className="mt-1 text-sm text-muted-foreground">
        A new version of MapAble is ready.
      </p>
      <button
        type="button"
        onClick={() => void applyUpdate()}
        disabled={isUpdating}
        className="mt-3 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {isUpdating ? "Updating…" : "Refresh now"}
      </button>
    </div>
  );
}
