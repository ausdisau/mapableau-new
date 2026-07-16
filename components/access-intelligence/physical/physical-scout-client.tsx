"use client";

import React, { useEffect, useState } from "react";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { FictionalBanner } from "@/components/access-intelligence/physical/fictional-banner";
import { Button } from "@/components/ui/button";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type Candidate = {
  id: string;
  fixtureId: string;
  label: string;
  category: string;
  confidence: number;
  summary: string;
  simulated: boolean;
};

export function PhysicalScoutClient() {
  const [fixtures, setFixtures] = useState<string[]>([]);
  const [fixtureId, setFixtureId] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/access-intelligence/physical/observations");
      const data = await res.json();
      if (res.ok) {
        const list = data.fixtures ?? [];
        setFixtures(list);
        if (list[0]) setFixtureId(list[0]);
      }
    })();
  }, []);

  const load = async (id: string) => {
    setError(null);
    const res = await fetch(
      `/api/access-intelligence/physical/observations?fixtureId=${encodeURIComponent(id)}`,
    );
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not load fixture");
      return;
    }
    setCandidates(data.candidates ?? []);
  };

  useEffect(() => {
    if (fixtureId) void load(fixtureId);
  }, [fixtureId]);

  const review = async (candidateId: string, decision: "accept" | "reject" | "edit") => {
    const res = await fetch("/api/access-intelligence/physical/observations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fixtureId,
        candidateId,
        decision,
        notes: decision === "edit" ? "Label adjusted by reviewer" : undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Review failed");
      return;
    }
    setMessage(
      `${decision}: recorded as provisional (measurementClaim=${String(data.measurementClaim)}). ${data.notice}`,
    );
  };

  return (
    <AccessIntelligenceShell
      title="Physical Systems · Scout"
      description="Review simulated perception candidates as a text list. Candidates stay provisional until human confirmation."
    >
      <FictionalBanner>
        Scout fixtures are simulated. Uncalibrated photographs cannot establish exact width,
        gradient, or distance. Facial recognition and disability inference are prohibited.
      </FictionalBanner>

      <label className="text-sm font-semibold" htmlFor="scout-fixture">
        Fixture
      </label>
      <select
        id="scout-fixture"
        className={`mt-1 min-h-11 w-full max-w-xl rounded-xl border border-slate-300 px-3 ${mapableCareFocusRing}`}
        value={fixtureId}
        onChange={(e) => setFixtureId(e.target.value)}
      >
        {fixtures.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm" role="status">
          {message}
        </p>
      ) : null}

      <h2 className="mt-8 text-xl font-black">Candidates (list equivalent to overlays)</h2>
      <ul className="mt-4 space-y-3">
        {candidates.map((c) => (
          <li key={c.id} className="rounded-xl border border-slate-200 p-4">
            <p className="font-bold">{c.label}</p>
            <p className="mt-1 text-sm text-slate-600">{c.summary}</p>
            <p className="mt-1 text-xs text-slate-500">
              {c.category} · confidence {(c.confidence * 100).toFixed(0)}% · simulated
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" size="default" variant="default" onClick={() => void review(c.id, "accept")}>
                Accept provisional
              </Button>
              <Button type="button" size="default" variant="outline" onClick={() => void review(c.id, "edit")}>
                Edit & accept
              </Button>
              <Button type="button" size="default" variant="outline" onClick={() => void review(c.id, "reject")}>
                Reject
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </AccessIntelligenceShell>
  );
}
