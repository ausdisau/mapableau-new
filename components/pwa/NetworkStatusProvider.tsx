"use client";

import { createContext, useContext, type ReactNode } from "react";

import {
  useNetworkStatus,
  type NetworkStatus,
} from "@/lib/hooks/useNetworkStatus";

const NetworkStatusContext = createContext<NetworkStatus>({
  online: true,
  ready: false,
});

export function NetworkStatusProvider({ children }: { children: ReactNode }) {
  const status = useNetworkStatus();
  return (
    <NetworkStatusContext.Provider value={status}>
      {children}
    </NetworkStatusContext.Provider>
  );
}

export function useNetworkStatusContext(): NetworkStatus {
  return useContext(NetworkStatusContext);
}
