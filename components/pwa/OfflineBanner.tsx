"use client";

import { WifiOff } from "lucide-react";

import { useNetworkStatusContext } from "@/components/pwa/NetworkStatusProvider";

export function OfflineBanner() {
  const { online } = useNetworkStatusContext();

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-0 right-0 top-0 z-[100] flex items-center justify-center gap-2 bg-amber-900 px-4 py-2 text-sm font-medium text-amber-50 shadow-md"
      style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
      <span>You are offline. Some features need a connection.</span>
    </div>
  );
}
