"use client";

import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export function MissionConsoleClient() {
  const [states, setStates] = useState<string[]>([]);
  const [current, setCurrent] = useState("draft");
  const [evaluation, setEvaluation] = useState<{
    unresolvedBlockers: string[];
    unknowns: string[];
    timingConflicts: string[];
    readyForReview: boolean;
  } | null>(null);
  const [proposalHash, setProposalHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/access-intelligence/missions");
      const data = await res.json();
      if (res.status === 403) {
        setEnabled(false);
        return;
      }
      if (!res.ok) {
        setError(data.error || "Could not load missions");
        return;
      }
      setEnabled(true);
      setStates(data.states ?? []);
    })();
  }, []);

  const post = async (body: Record<string, unknown>) => {
    setError(null);
    const res = await fetch("/api/access-intelligence/missions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || `Failed (${res.status})`);
      return null;
    }
    return data;
  };

  if (enabled === false) {
    return (
      <p role="status">
        Mission console is off. Set{" "}
        <code>ACCESS_INTELLIGENCE_MISSION_CONSOLE=true</code>.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <p>
        Participant-authorised multi-module coordination. Extends support
        coordinator and cases — does not replace case management. Current state:{" "}
        <strong>{current}</strong>
      </p>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          className={mapableCareFocusRing}
          onClick={async () => {
            const data = await post({
              action: "transition",
              current,
              next: "awaiting_participant_input",
            });
            if (data?.status) setCurrent(data.status);
          }}
        >
          Advance to awaiting participant input
        </Button>
        <Button
          type="button"
          variant="outline"
          className={mapableCareFocusRing}
          onClick={async () => {
            const data = await post({
              action: "evaluate",
              dependencies: [
                { status: "open", summary: "Accessible transport not confirmed" },
              ],
              unknowns: ["quiet waiting space"],
              timingConflicts: [],
            });
            if (data?.evaluation) setEvaluation(data.evaluation);
          }}
        >
          Evaluate blockers
        </Button>
        <Button
          type="button"
          variant="outline"
          className={mapableCareFocusRing}
          onClick={async () => {
            const data = await post({
              action: "propose_write",
              payload: {
                type: "create_transport_booking",
                visitPlanId: "vp-demo",
                window: "2026-07-20T09:00:00.000Z",
              },
            });
            if (data?.proposalHash) setProposalHash(data.proposalHash);
          }}
        >
          Hash write proposal
        </Button>
      </div>
      {states.length ? (
        <p className="text-sm">
          Allowed lifecycle: {states.join(" → ")}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      ) : null}
      {evaluation ? (
        <section aria-labelledby="mission-eval">
          <h2 id="mission-eval" className="text-xl font-bold">
            Blocker evaluation
          </h2>
          <p>
            Ready for review:{" "}
            <strong>{evaluation.readyForReview ? "yes" : "no"}</strong>
          </p>
          <ul className="mt-2 list-disc pl-5">
            {evaluation.unresolvedBlockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
            {evaluation.unknowns.map((u) => (
              <li key={u}>Unknown: {u}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {proposalHash ? (
        <p role="status">
          Write proposal hash (approval-gated): <code>{proposalHash}</code>
        </p>
      ) : null}
    </div>
  );
}
