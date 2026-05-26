"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type AccessRequest = {
  id: string;
  coordinatorId: string;
  status: string;
  createdAt: string;
  scopesJson: unknown;
};

export function CoordinatorAccessRequests({
  requests,
}: {
  requests: AccessRequest[];
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const pending = requests.filter((r) => r.status === "pending");

  return (
    <ul className="space-y-3">
      {pending.map((r) => (
        <li key={r.id} className="rounded-lg border p-3">
          <p className="text-sm">Coordinator access request</p>
          <p className="text-xs text-muted-foreground">Status: {r.status}</p>
          <Button
            type="button"
            variant="default"
            size="sm"
            className="mt-2"
            disabled={loadingId === r.id}
            onClick={async () => {
              setLoadingId(r.id);
              await fetch(
                `/api/support-coordinator/access-requests?action=approve&requestId=${r.id}`,
                { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }
              );
              setLoadingId(null);
              router.refresh();
            }}
          >
            Approve access
          </Button>
        </li>
      ))}
      {pending.length === 0 ? (
        <li className="text-sm text-muted-foreground">No pending access requests.</li>
      ) : null}
    </ul>
  );
}
