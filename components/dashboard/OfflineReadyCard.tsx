"use client";

import { CloudOff } from "lucide-react";

import { useNetworkStatus } from "@/lib/hooks/useNetworkStatus";

export function OfflineReadyCard() {
  const { online, ready } = useNetworkStatus();
  if (!ready || online) return null;

  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-4 text-sm"
    >
      <CloudOff className="h-5 w-5 shrink-0" aria-hidden />
      <p>
        You are offline. Drafts you save will sync when you reconnect and sign
        in again.
      </p>
    </div>
  );
}
