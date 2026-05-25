"use client";

import { useEffect, useState } from "react";

const SW_PATH = "/sw.js";

function isDevSwDisabled(): boolean {
  return process.env.NODE_ENV === "development";
}

export function ServiceWorkerRegister() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    if (isDevSwDisabled()) {
      return;
    }

    let registration: ServiceWorkerRegistration | undefined;

    const register = async () => {
      try {
        registration = await navigator.serviceWorker.register(SW_PATH, {
          scope: "/",
        });

        registration.addEventListener("updatefound", () => {
          const installing = registration?.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setUpdateAvailable(true);
            }
          });
        });
      } catch {
        /* SW optional — app still works */
      }
    };

    void register();

    return () => {
      registration = undefined;
    };
  }, []);

  if (!updateAvailable) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md rounded-lg border border-border bg-card p-4 shadow-lg md:bottom-4"
      aria-live="polite"
    >
      <p className="text-sm font-medium">A new version of MapAble is ready.</p>
      <button
        type="button"
        className="mt-2 min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
        onClick={() => {
          navigator.serviceWorker.controller?.postMessage({
            type: "SKIP_WAITING",
          });
          window.location.reload();
        }}
      >
        Update now
      </button>
    </div>
  );
}
