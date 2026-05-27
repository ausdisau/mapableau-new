"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type Proposal = {
  id: string;
  rank: number;
  combinedScore: number;
  status: string;
  gateResult: string;
  gateSummary: unknown;
  workerProfile: { id: string; displayName: string };
};

export function CareAllocationPanel({
  careBookingId,
  organisationId,
  initialProposals = [],
}: {
  careBookingId: string;
  organisationId: string;
  initialProposals?: Proposal[];
}) {
  const [proposals, setProposals] = useState<Proposal[]>(initialProposals);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function refreshQueue() {
    const res = await fetch(
      `/api/care/allocations?organisationId=${encodeURIComponent(organisationId)}&careBookingId=${encodeURIComponent(careBookingId)}`
    );
    const data = await res.json();
    if (res.ok && data.proposals) {
      setProposals(data.proposals);
    }
  }

  async function runAllocation() {
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/care/allocations/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ careBookingId, trigger: "manual" }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error ?? data.reason ?? "Allocation failed");
      if (data.skipped) {
        setMessage(
          "Allocation is disabled. Set CARE_ALLOCATION_ENABLED=true to enable suggestions."
        );
      }
      return;
    }
    setMessage("Suggestions updated. Review gate badges before approving.");
    await refreshQueue();
    if (data.proposals?.length) {
      setProposals(
        data.proposals.map((p: Proposal & { workerProfile?: Proposal["workerProfile"] }) => ({
          ...p,
          workerProfile: p.workerProfile ?? { id: "", displayName: "Worker" },
        }))
      );
    }
  }

  async function approve(proposalId: string) {
    setLoading(true);
    const res = await fetch(
      `/api/care/allocations/proposals/${proposalId}/approve`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }
    );
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error ?? "Approve failed");
      return;
    }
    setMessage("Worker assigned via allocation approval.");
    window.location.reload();
  }

  async function reject(proposalId: string) {
    setLoading(true);
    await fetch(`/api/care/allocations/proposals/${proposalId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    setLoading(false);
    await refreshQueue();
    setMessage("Proposal rejected.");
  }

  return (
    <section className="rounded-xl border p-4 space-y-3">
      <h2 className="font-semibold">Worker allocation (with safeguards)</h2>
      <p className="text-sm text-muted-foreground">
        Ranked suggestions use eligibility, schedule, and compliance gates.
        Assignments require approval unless your organisation enables conditional
        auto-assign and all gates pass.
      </p>
      <Button
        type="button"
        variant="outline"
        size="default"
        disabled={loading}
        onClick={() => void runAllocation()}
      >
        Suggest workers
      </Button>
      {proposals.length > 0 ? (
        <ul className="space-y-2 text-sm">
          {proposals.map((p) => (
            <li key={p.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  #{p.rank} {p.workerProfile.displayName} — score{" "}
                  {(p.combinedScore * 100).toFixed(0)}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {p.status} / {p.gateResult}
                </span>
              </div>
              {p.status !== "executed" && p.status !== "rejected" ? (
                <div className="mt-2 flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    disabled={
                      loading ||
                      p.status === "blocked" ||
                      p.status === "executed"
                    }
                    onClick={() => void approve(p.id)}
                  >
                    Approve & assign
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={loading}
                    onClick={() => void reject(p.id)}
                  >
                    Reject
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {message ? (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      ) : null}
    </section>
  );
}
