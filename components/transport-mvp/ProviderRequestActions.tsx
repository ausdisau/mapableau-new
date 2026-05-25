"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProviderRequestActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function act(path: "accept" | "decline") {
    setLoading(true);
    await fetch(`/api/transport-mvp/requests/${requestId}/${path}`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Request actions">
      <button
        type="button"
        disabled={loading}
        onClick={() => act("accept")}
        className="min-h-11 rounded-lg bg-primary px-4 font-semibold text-primary-foreground"
      >
        Accept
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => act("decline")}
        className="min-h-11 rounded-lg border px-4 font-semibold"
      >
        Decline
      </button>
    </div>
  );
}
