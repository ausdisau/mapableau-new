"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  coordinateFetch,
  participantQuery,
} from "@/components/coordinate/coordinate-client";
import { ProviderShortlist } from "@/components/coordinate/ProviderShortlist";
import { CoordinatePageHeader } from "@/components/coordinate/CoordinateShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function CoordinateProvidersPage() {
  const searchParams = useSearchParams();
  const participantId = searchParams.get("participantId");
  const query = participantQuery(participantId);

  const [planId, setPlanId] = useState<string | null>(null);
  const [needDescription, setNeedDescription] = useState(
    "Support worker for community access and daily living skills.",
  );
  const [items, setItems] = useState<
    Array<{
      id: string;
      ndisProviderId: string;
      rank: number;
      matchScore?: number | null;
      matchReason?: string | null;
      conflictFlagsJson?: unknown;
      status: string;
      providerName?: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const plansRes = await coordinateFetch<{ plans: Array<{ id: string; status: string }> }>(
        `/api/coordinate/plans${query}`,
      );
      const plan = plansRes.plans.find((p) => ["draft", "active"].includes(p.status));
      if (!plan) {
        setPlanId(null);
        return;
      }
      setPlanId(plan.id);
      const res = await coordinateFetch<{ items: typeof items }>(
        `/api/coordinate/plans/${plan.id}/providers/shortlist${query}`,
      );
      setItems(res.items);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <CoordinatePageHeader title="Provider shortlist" />
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      {planId ? (
        <>
          <div className="space-y-3 rounded-xl border p-4">
            <label className="text-sm font-medium" htmlFor="need-description">
              Describe the support you need
            </label>
            <Textarea
              id="need-description"
              value={needDescription}
              onChange={(e) => setNeedDescription(e.target.value)}
              rows={4}
            />
            <Button
              variant="default"
              size="default"
              className="min-h-11"
              disabled={generating}
              onClick={async () => {
                setGenerating(true);
                try {
                  await coordinateFetch(
                    `/api/coordinate/plans/${planId}/providers/shortlist${query}`,
                    {
                      method: "POST",
                      body: JSON.stringify({ participantId, needDescription }),
                    },
                  );
                  await load();
                } finally {
                  setGenerating(false);
                }
              }}
            >
              {generating ? "Generating…" : "Generate shortlist"}
            </Button>
          </div>
          <ProviderShortlist
            items={items}
            onReview={async (itemId, status) => {
              await coordinateFetch(
                `/api/coordinate/plans/${planId}/providers/shortlist${query}`,
                {
                  method: "PATCH",
                  body: JSON.stringify({ participantId, itemId, status }),
                },
              );
              await load();
            }}
          />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Create a plan summary before generating provider matches.
        </p>
      )}
    </div>
  );
}
