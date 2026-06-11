"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { ConsentGate } from "@/components/coordinate/ConsentGate";
import {
  coordinateFetch,
  participantQuery,
} from "@/components/coordinate/coordinate-client";
import { PlanSummaryCard } from "@/components/coordinate/PlanSummaryCard";
import { CoordinatePageHeader } from "@/components/coordinate/CoordinateShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Plan = {
  id: string;
  status: string;
  summaryJson: { headline?: string; keyPoints?: string[] };
  aiConfidence?: number | null;
  aiReason?: string | null;
  requiresReview?: boolean;
};

export default function CoordinatePlanPage() {
  const searchParams = useSearchParams();
  const participantId = searchParams.get("participantId");
  const query = participantQuery(participantId);

  const [consent, setConsent] = useState<{ active: boolean; message: string } | null>(
    null,
  );
  const [plan, setPlan] = useState<Plan | null>(null);
  const [planText, setPlanText] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const consentRes = await coordinateFetch<{ active: boolean; message: string }>(
        `/api/coordinate/consent${query}`,
      );
      setConsent(consentRes);

      const plansRes = await coordinateFetch<{ plans: Plan[] }>(
        `/api/coordinate/plans${query}`,
      );
      const active = plansRes.plans.find((p) =>
        ["draft", "active"].includes(p.status),
      );
      setPlan(active ?? plansRes.plans[0] ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load plan");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleUpload() {
    if (!planText.trim()) return;
    setUploading(true);
    setError(null);
    try {
      await coordinateFetch(`/api/coordinate/plans${query}`, {
        method: "POST",
        body: JSON.stringify({ participantId, planText }),
      });
      setPlanText("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleApprove() {
    if (!plan) return;
    setApproving(true);
    try {
      await coordinateFetch(`/api/coordinate/plans/${plan.id}${query}`, {
        method: "PATCH",
        body: JSON.stringify({ participantId, action: "approve_summary" }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approve failed");
    } finally {
      setApproving(false);
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <CoordinatePageHeader
        title="Your plan"
        description="Upload plan text, review the AI summary, and approve before it becomes active."
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}

      <ConsentGate active={consent?.active ?? true} message={consent?.message ?? ""}>
        <div className="space-y-6">
          <div className="rounded-xl border p-4 space-y-3">
            <h2 className="font-semibold">Upload or paste plan text</h2>
            <Textarea
              value={planText}
              onChange={(e) => setPlanText(e.target.value)}
              rows={6}
              placeholder="Paste NDIS plan goals, budgets, and notes here…"
            />
            <Button variant="default" size="default" className="min-h-11" onClick={() => void handleUpload()} disabled={uploading}>
              {uploading ? "Generating summary…" : "Create draft summary"}
            </Button>
          </div>

          {plan ? (
            <PlanSummaryCard
              summary={plan.summaryJson}
              confidence={plan.aiConfidence}
              reason={plan.aiReason}
              requiresReview={plan.requiresReview}
              status={plan.status}
              onApprove={plan.status === "draft" ? () => void handleApprove() : undefined}
              approving={approving}
            />
          ) : null}
        </div>
      </ConsentGate>
    </div>
  );
}
