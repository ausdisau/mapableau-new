"use client";

import { WifiOff } from "lucide-react";

import { useNetworkStatusContext } from "@/components/pwa/NetworkStatusProvider";

export function OfflineBanner() {
  const { online, ready } = useNetworkStatusContext();

  if (!ready || online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 bg-amber-600 px-4 py-2 text-sm font-medium text-white"
    >
      <WifiOff className="h-4 w-4" aria-hidden />
      <span>You are offline. Some features are unavailable.</span>
    </div>
  );
}
