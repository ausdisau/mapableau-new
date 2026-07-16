"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { ApprovalCard } from "@/components/access-intelligence/approval-card";
import { FictionalBanner } from "@/components/access-intelligence/physical/fictional-banner";
import { Button } from "@/components/ui/button";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type PassportOpt = { id: string; name: string; isDefault: boolean };

type PlanResult = {
  decision: {
    status: string;
    blockers: string[];
    unknowns: string[];
    conditions: string[];
    matchedRequirements?: Array<{ explanation?: string }>;
  };
  route: {
    id: string;
    steps: Array<{ instruction: string }>;
  } | null;
  fallbackRoute: { id: string; steps: Array<{ instruction: string }> } | null;
  availableCapabilities: Array<{
    id: string;
    label: string;
    enabled: boolean;
    risk: string;
    description: string;
    requireUserApproval: boolean;
  }>;
  rejectedRouteSummaries: Array<{ summary: string; reasons: string[] }>;
  mode: string;
  fictionalNotice: string;
};

type Execution = {
  id: string;
  state: string;
  proposal: {
    capabilityId: string;
    actionType: string;
    rationale: string;
    proposalHash: string;
    fictionalNotice?: string;
  };
};

export function PhysicalPlanClient({
  initialPassportId,
}: {
  initialPassportId?: string;
}) {
  const [passports, setPassports] = useState<PassportOpt[]>([]);
  const [passportId, setPassportId] = useState(
    initialPassportId ?? "passport-power-chair",
  );
  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingCap, setPendingCap] = useState<{
    id: string;
    label: string;
    description: string;
  } | null>(null);
  const [execution, setExecution] = useState<Execution | null>(null);
  const [conciergeMsg, setConciergeMsg] = useState(
    "Can I reach Room 3.12 with my power chair?",
  );
  const [conciergeReply, setConciergeReply] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/access-intelligence/physical/passports");
      const data = await res.json();
      if (res.ok) {
        setPassports(
          (data.passports ?? []).map((p: PassportOpt) => ({
            id: p.id,
            name: p.name,
            isDefault: p.isDefault,
          })),
        );
      }
    })();
  }, []);

  const runPlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/access-intelligence/physical/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passportId,
          destinationLabel: "Interview Room 3.12",
          toNodeId: "n-hcc-room",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Plan failed");
      setPlan(data as PlanResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Plan failed");
    } finally {
      setLoading(false);
    }
  }, [passportId]);

  useEffect(() => {
    void runPlan();
  }, [runPlan]);

  const saveVisit = async () => {
    const res = await fetch("/api/access-intelligence/physical/visit-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        passportId,
        destinationLabel: "Interview Room 3.12",
        toNodeId: "n-hcc-room",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not save visit plan");
      return;
    }
    window.location.href = "/access-intelligence/physical/visits";
  };

  const propose = async () => {
    if (!pendingCap) return;
    const res = await fetch("/api/access-intelligence/physical/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        capabilityId: pendingCap.id,
        rationale: `Visit support: ${pendingCap.label}`,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Proposal denied");
      setPendingCap(null);
      return;
    }
    setExecution(data.execution);
    setPendingCap(null);
  };

  const approveAndExecute = async () => {
    if (!execution) return;
    const approveRes = await fetch(
      `/api/access-intelligence/physical/actions/${execution.id}/approve`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
    );
    const approveData = await approveRes.json();
    if (!approveRes.ok) {
      setError(approveData.error || "Approval failed");
      return;
    }
    const execRes = await fetch(
      `/api/access-intelligence/physical/actions/${execution.id}/execute`,
      { method: "POST" },
    );
    const execData = await execRes.json();
    if (!execRes.ok) {
      setError(execData.error || "Execute failed");
      return;
    }
    setExecution(execData.execution);
    void runPlan();
  };

  const askConcierge = async () => {
    const res = await fetch("/api/access-intelligence/physical/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: conciergeMsg, passportId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Concierge failed");
      return;
    }
    setConciergeReply(data.reply);
  };

  const statusClass = useMemo(() => {
    const s = plan?.decision.status;
    if (s === "suitable" || s === "likely_suitable") return "text-emerald-800";
    if (s === "blocked" || s === "unsuitable") return "text-red-800";
    return "text-slate-800";
  }, [plan?.decision.status]);

  return (
    <AccessIntelligenceShell
      title="Physical Systems · Concierge plan"
      description="Deterministic visit decision for Harbour Civic Centre with map-free route list, unknowns, and approval-gated physical actions."
    >
      <FictionalBanner>{plan?.fictionalNotice}</FictionalBanner>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="text-sm font-semibold" htmlFor="plan-passport">
            Passport
          </label>
          <select
            id="plan-passport"
            className={`mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 ${mapableCareFocusRing}`}
            value={passportId}
            onChange={(e) => setPassportId(e.target.value)}
          >
            {passports.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <Button
          type="button"
          variant="default"
          size="default"
          disabled={loading}
          onClick={() => void runPlan()}
        >
          {loading ? "Planning…" : "Recalculate"}
        </Button>
        <Button type="button" variant="outline" size="default" onClick={() => void saveVisit()}>
          Save visit plan
        </Button>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm" role="alert">
          {error}
        </p>
      ) : null}

      {plan ? (
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section aria-labelledby="decision-h">
            <h2 id="decision-h" className="text-xl font-black">
              Decision
            </h2>
            <p className={`mt-2 text-lg font-bold ${statusClass}`}>
              Status: {plan.decision.status}
            </p>
            <p className="mt-1 text-sm text-slate-600">Mode: {plan.mode}</p>
            <h3 className="mt-4 font-semibold">Confirmed / conditions</h3>
            <ul className="mt-1 list-disc pl-5 text-sm">
              {(plan.decision.conditions ?? []).slice(0, 8).map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <h3 className="mt-4 font-semibold">Blockers</h3>
            <ul className="mt-1 list-disc pl-5 text-sm">
              {plan.decision.blockers.length === 0 ? (
                <li>None</li>
              ) : (
                plan.decision.blockers.map((b) => <li key={b}>{b}</li>)
              )}
            </ul>
            <h3 className="mt-4 font-semibold">Unknowns</h3>
            <ul className="mt-1 list-disc pl-5 text-sm">
              {plan.decision.unknowns.length === 0 ? (
                <li>None reported</li>
              ) : (
                plan.decision.unknowns.map((u) => <li key={u}>{u}</li>)
              )}
            </ul>
          </section>

          <section aria-labelledby="route-h">
            <h2 id="route-h" className="text-xl font-black">
              Route (text list)
            </h2>
            {plan.route ? (
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
                {plan.route.steps.map((s, i) => (
                  <li key={`${i}-${s.instruction}`}>{s.instruction}</li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-sm text-slate-600">No eligible primary route.</p>
            )}
            {plan.fallbackRoute ? (
              <>
                <h3 className="mt-4 font-semibold">Fallback</h3>
                <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm">
                  {plan.fallbackRoute.steps.map((s, i) => (
                    <li key={`fb-${i}`}>{s.instruction}</li>
                  ))}
                </ol>
              </>
            ) : null}
            {plan.rejectedRouteSummaries.length > 0 ? (
              <>
                <h3 className="mt-4 font-semibold">Rejected alternatives</h3>
                <ul className="mt-2 space-y-2 text-sm">
                  {plan.rejectedRouteSummaries.map((r) => (
                    <li key={r.summary} className="rounded-lg border border-slate-200 p-2">
                      {r.summary}
                      <ul className="mt-1 list-disc pl-4 text-slate-600">
                        {r.reasons.map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </section>
        </div>
      ) : null}

      {plan ? (
        <section className="mt-10" aria-labelledby="caps-h">
          <h2 id="caps-h" className="text-xl font-black">
            Physical actions (approval required)
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            The Concierge proposes only. Safety Kernel and Action Gateway own dispatch.
          </p>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {plan.availableCapabilities
              .filter((c) => c.enabled)
              .map((c) => (
                <li
                  key={c.id}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <p className="font-bold">{c.label}</p>
                  <p className="mt-1 text-sm text-slate-600">{c.description}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                    Risk: {c.risk}
                  </p>
                  <Button
                    type="button"
                    className="mt-3"
                    variant="outline"
                    size="default"
                    onClick={() =>
                      setPendingCap({
                        id: c.id,
                        label: c.label,
                        description: c.description,
                      })
                    }
                  >
                    Propose action
                  </Button>
                </li>
              ))}
          </ul>
        </section>
      ) : null}

      {pendingCap ? (
        <div className="mt-6">
          <ApprovalCard
            title={`Approve proposal: ${pendingCap.label}`}
            recipient="Harbour Civic Centre (fictional)"
            purpose="Visit physical support"
            fieldsOrQuestions={[
              pendingCap.description,
              "Simulated adapter only — no live hardware",
              "You can cancel before execute",
            ]}
            onApprove={() => void propose()}
            onCancel={() => setPendingCap(null)}
          />
        </div>
      ) : null}

      {execution ? (
        <div className="mt-6 rounded-xl border border-slate-300 bg-slate-50 p-4">
          <h3 className="font-black">Action progress</h3>
          <p className="mt-2 text-sm" aria-live="polite">
            State: <strong>{execution.state}</strong> · {execution.proposal.actionType} ·{" "}
            {execution.id}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {execution.state === "awaiting_user_approval" ||
            execution.state === "approved" ? (
              <Button type="button" variant="default" size="default" onClick={() => void approveAndExecute()}>
                {execution.state === "awaiting_user_approval"
                  ? "Approve & execute (simulated)"
                  : "Execute (simulated)"}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={async () => {
                await fetch(
                  `/api/access-intelligence/physical/actions/${execution.id}/cancel`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reason: "User cancelled" }),
                  },
                );
                setExecution(null);
              }}
            >
              Cancel
            </Button>
            <Button asChild variant="outline" size="default">
              <Link href="/access-intelligence/physical/actions">Action history</Link>
            </Button>
          </div>
        </div>
      ) : null}

      <section className="mt-10" aria-labelledby="chat-h">
        <h2 id="chat-h" className="text-xl font-black">
          Optional Concierge chat
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Chat is optional. Standard controls above remain the primary path. Works without an AI key.
        </p>
        <label className="mt-3 block text-sm font-semibold" htmlFor="concierge-msg">
          Message
        </label>
        <textarea
          id="concierge-msg"
          className={`mt-1 min-h-24 w-full rounded-xl border border-slate-300 p-3 ${mapableCareFocusRing}`}
          value={conciergeMsg}
          onChange={(e) => setConciergeMsg(e.target.value)}
        />
        <Button
          type="button"
          className="mt-3"
          variant="outline"
          size="default"
          onClick={() => void askConcierge()}
        >
          Ask Concierge
        </Button>
        {conciergeReply ? (
          <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-slate-200 bg-white p-4 text-sm">
            {conciergeReply}
          </pre>
        ) : null}
      </section>
    </AccessIntelligenceShell>
  );
}
