"use client";

import { useEffect, useState } from "react";

export type NetworkStatus = {
  online: boolean;
  /** True after reconnecting following an offline period */
  wasOffline: boolean;
};

export function useNetworkStatus(): NetworkStatus {
  const [online, setOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const sync = () => {
      const next = navigator.onLine;
      setOnline((prev) => {
        if (!prev && next) setWasOffline(true);
        return next;
      });
    };

    setOnline(navigator.onLine);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  return { online, wasOffline };
}
