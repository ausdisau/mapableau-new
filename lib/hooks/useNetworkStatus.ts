"use client";

import { useCallback, useEffect, useState } from "react";

export type NetworkStatus = {
  online: boolean;
  /** True after first browser event; avoids SSR mismatch */
  ready: boolean;
};

export function useNetworkStatus(): NetworkStatus {
  const [online, setOnline] = useState(true);
  const [ready, setReady] = useState(false);

  const sync = useCallback(() => {
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    setReady(true);
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, [sync]);

  return { online, ready };
}
