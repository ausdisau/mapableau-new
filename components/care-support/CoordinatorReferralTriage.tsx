"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type ReferralRow = {
  id: string;
  summary: string;
  status: string;
  referralType: string;
  priority: string;
};

export function CoordinatorReferralTriage({
  participantId,
  referrals,
}: {
  participantId: string;
  referrals: ReferralRow[];
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  return (
    <ul className="space-y-3">
      {referrals.map((r) => (
        <li key={r.id} className="rounded-lg border p-3">
          <p className="font-medium">{r.summary}</p>
          <p className="text-sm text-muted-foreground">
            {r.referralType} — {r.status} — {r.priority}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {r.referralType === "internal_care" ? (
              <Button
                type="button"
                variant="default"
                size="sm"
                disabled={loadingId === r.id}
                onClick={async () => {
                  setLoadingId(r.id);
                  await fetch(`/api/care-support/referrals/${r.id}/create-care-request`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: "{}",
                  });
                  setLoadingId(null);
                  router.refresh();
                }}
              >
                Create care request
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={loadingId === r.id}
              onClick={async () => {
                setLoadingId(r.id);
                await fetch(`/api/care-support/referrals/${r.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: "triaged" }),
                });
                setLoadingId(null);
                router.refresh();
              }}
            >
              Mark triaged
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={loadingId === r.id}
              onClick={async () => {
                setLoadingId(r.id);
                await fetch(`/api/care-support/referrals/${r.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: "accepted" }),
                });
                setLoadingId(null);
                router.refresh();
              }}
            >
              Accept
            </Button>
          </div>
        </li>
      ))}
      {referrals.length === 0 ? (
        <li className="text-sm text-muted-foreground">No referrals for this participant.</li>
      ) : null}
    </ul>
  );
}
