"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import { useNetworkStatus } from "@/hooks/useNetworkStatus";

type NetworkContextValue = ReturnType<typeof useNetworkStatus>;

const NetworkStatusContext = createContext<NetworkContextValue | null>(null);

export function NetworkStatusProvider({ children }: { children: ReactNode }) {
  const status = useNetworkStatus();
  const value = useMemo(() => status, [status.online, status.wasOffline]);

  return (
    <NetworkStatusContext.Provider value={value}>
      {children}
    </NetworkStatusContext.Provider>
  );
}

export function useNetworkStatusContext(): NetworkContextValue {
  const ctx = useContext(NetworkStatusContext);
  if (!ctx) {
    throw new Error(
      "useNetworkStatusContext must be used within NetworkStatusProvider"
    );
  }
  return ctx;
}
