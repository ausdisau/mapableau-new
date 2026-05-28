"use client";

import { useState } from "react";

type Candidate = {
  id: string;
  candidateType: string;
  score: number;
  scoreExplanation: string;
  status: string;
  factors?: { factorType: string; score: number; explanation: string }[];
};

export function MatchCandidateCard({
  candidate,
}: {
  candidate: Candidate;
  matchRunId?: string;
}) {
  const [status, setStatus] = useState(candidate.status);

  async function selectCandidate() {
    const res = await fetch(`/api/matching/candidates/${candidate.id}/select`, {
      method: "POST",
    });
    if (res.ok) setStatus("selected");
  }

  async function rejectCandidate() {
    const res = await fetch(`/api/matching/candidates/${candidate.id}/reject`, {
      method: "POST",
    });
    if (res.ok) setStatus("rejected");
  }

  return (
    <article className="rounded-lg border p-4">
      <h2 className="font-semibold">
        {candidate.candidateType} — score {(candidate.score * 100).toFixed(0)}%
      </h2>
      <p className="mt-2 text-sm">{candidate.scoreExplanation}</p>
      <p className="mt-1 text-sm text-muted-foreground">Status: {status}</p>
      {candidate.factors && candidate.factors.length > 0 && (
        <ul className="mt-3 list-disc pl-5 text-sm" aria-label="Match factors">
          {candidate.factors.map((f, i) => (
            <li key={i}>
              {f.factorType}: {f.explanation}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={selectCandidate}
          className="min-h-11 min-w-[8rem] rounded-md bg-primary px-4 py-2 text-primary-foreground"
        >
          Select (confirm)
        </button>
        <button
          type="button"
          onClick={rejectCandidate}
          className="min-h-11 min-w-[8rem] rounded-md border px-4 py-2"
        >
          Reject
        </button>
      </div>
    </article>
  );
}
