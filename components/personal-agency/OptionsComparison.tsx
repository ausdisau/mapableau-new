"use client";
import { useMemo, useState } from "react";
import type { OptionsPresentation } from "@/lib/ai/platform/options-engine/presentation";
import { DEFAULT_RANKING_PRIORITIES, type OptionsSession, type RankingPriorities } from "@/lib/ai/platform/options-engine/types";

export type OptionsComparisonProps = {
  initialSession?: OptionsSession | null;
  initialPresentation?: OptionsPresentation | null;
  domain?: OptionsSession["domain"];
  missionId?: string;
  candidatesPayload?: unknown[];
  requirementsPayload?: unknown[];
  onChosen?: (session: OptionsSession, optionId: string) => void;
};

const DIMENSIONS: Array<keyof RankingPriorities> = [
  "access_fit","time_fit","availability","participant_preference","distance","continuity","known_cost","evidence_quality",
];

/** My MapAble Options comparison — explainable, adjustable ranking, choose → prepare draft. WCAG 2.2 AA. */
export function OptionsComparison({
  initialSession = null, initialPresentation = null, domain = "care", missionId,
  candidatesPayload = [], requirementsPayload = [], onChosen,
}: OptionsComparisonProps) {
  const [session, setSession] = useState<OptionsSession | null>(initialSession);
  const [presentation, setPresentation] = useState<OptionsPresentation | null>(initialPresentation);
  const [priorities, setPriorities] = useState<RankingPriorities>(initialSession?.rankingPriorities ?? { ...DEFAULT_RANKING_PRIORITIES });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chosenNotice, setChosenNotice] = useState<string | null>(null);
  const buttonClass = "inline-flex min-h-11 items-center justify-center rounded-lg border border-[#005B7F] bg-white px-4 py-2 text-sm font-semibold text-[#0C1833] hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40 disabled:opacity-50";
  const primaryClass = "inline-flex min-h-11 items-center justify-center rounded-lg bg-[#005B7F] px-4 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40 disabled:opacity-50";
  const hasCandidates = candidatesPayload.length > 0;
  const sortedOptions = useMemo(() => presentation?.options ?? [], [presentation]);

  async function generate() {
    if (!hasCandidates) { setError("No candidates available to compare yet."); return; }
    setBusy(true); setError(null); setChosenNotice(null);
    try {
      const res = await fetch("/api/ai/options/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domain, missionId, requirements: requirementsPayload, rankingPriorities: priorities, candidates: candidatesPayload, requestModelExplanation: false }) });
      const data = (await res.json().catch(() => ({}))) as { error?: string; session?: OptionsSession; presentation?: OptionsPresentation };
      if (!res.ok || !data.session) { setError(data.error ?? "Could not generate options."); return; }
      setSession(data.session); setPresentation(data.presentation ?? null); setPriorities(data.session.rankingPriorities);
    } catch { setError("Network error. Please try again."); } finally { setBusy(false); }
  }

  async function applyRanking() {
    if (!session) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch(`/api/ai/options/${session.sessionId}/rank`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rankingPriorities: priorities, candidates: candidatesPayload }) });
      const data = (await res.json().catch(() => ({}))) as { error?: string; session?: OptionsSession; presentation?: OptionsPresentation };
      if (!res.ok || !data.session) { setError(data.error ?? "Could not update ranking."); return; }
      setSession(data.session); setPresentation(data.presentation ?? null);
    } catch { setError("Network error. Please try again."); } finally { setBusy(false); }
  }

  async function choose(optionId: string) {
    if (!session) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch(`/api/ai/options/${session.sessionId}/choose`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ optionId, prepareActionProposal: true, missionId: missionId ?? session.missionId ?? undefined }) });
      const data = (await res.json().catch(() => ({}))) as { error?: string; result?: { session: OptionsSession; preparedProposalId: string | null; nextStep: string }; presentation?: OptionsPresentation };
      if (!res.ok || !data.result) { setError(data.error ?? "Could not choose option."); return; }
      setSession(data.result.session); setPresentation(data.presentation ?? null);
      setChosenNotice(`Draft action prepared${data.result.preparedProposalId ? ` (${data.result.preparedProposalId})` : ""}. Nothing was assigned, booked, or disclosed. ${data.result.nextStep}`);
      onChosen?.(data.result.session, optionId);
    } catch { setError("Network error. Please try again."); } finally { setBusy(false); }
  }

  return (
    <section aria-labelledby="options-comparison-heading" className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 id="options-comparison-heading" className="text-xl font-bold text-[#0C1833]">Compare options</h2>
      <p className="mt-2 text-sm text-slate-700">MapAble lists options that meet your hard requirements. You adjust what matters most, then choose. Choosing prepares a draft for your approval — it does not assign a worker, book transport, or share disability details with employers.</p>
      {error ? <p role="alert" className="mt-3 text-sm font-medium text-red-700">{error}</p> : null}
      {chosenNotice ? <p role="status" className="mt-3 text-sm font-medium text-emerald-800">{chosenNotice}</p> : null}
      <fieldset className="mt-4">
        <legend className="text-sm font-semibold text-[#0C1833]">Your ranking priorities</legend>
        <p className="mt-1 text-xs text-slate-600">Transparent factors only. Values are relative weights (0–1) and are normalised when applied.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {DIMENSIONS.map((dim) => (
            <label key={dim} className="flex flex-col gap-1 text-sm">
              <span className="font-medium capitalize text-[#0C1833]">{dim.replace(/_/g, " ")}</span>
              <input type="number" min={0} max={1} step={0.05} value={priorities[dim]} onChange={(e) => setPriorities((prev) => ({ ...prev, [dim]: Math.min(1, Math.max(0, Number(e.target.value) || 0)) }))} className="min-h-11 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40" />
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className={primaryClass} onClick={() => void generate()} disabled={busy || !hasCandidates}>{session ? "Refresh options" : "Generate options"}</button>
        <button type="button" className={buttonClass} onClick={() => void applyRanking()} disabled={busy || !session}>Apply my ranking</button>
      </div>
      {presentation ? (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-slate-700">{presentation.summary}</p>
          <p className="text-xs text-slate-600">{presentation.authorityNotice}</p>
          {sortedOptions.length === 0 ? <p className="text-sm text-slate-700">No safe options passed your hard requirements.</p> : (
            <ul className="space-y-4" aria-label="Ranked options">
              {sortedOptions.map((opt) => (
                <li key={opt.optionId} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-[#0C1833]">{opt.title}</h3>
                      <p className="text-sm text-slate-700">Provided by {opt.provider} · Score {opt.scorePercent} · Verification: {opt.verification}</p>
                    </div>
                    <button type="button" className={primaryClass} disabled={busy} onClick={() => void choose(opt.optionId)} aria-label={`Choose ${opt.title} and prepare draft action`}>Choose — prepare draft</button>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div><h4 className="text-sm font-semibold">Why it matches</h4><ul className="mt-1 list-disc pl-5 text-sm text-slate-700">{opt.why.map((w) => <li key={w}>{w}</li>)}</ul></div>
                    <div><h4 className="text-sm font-semibold">Unknowns</h4><ul className="mt-1 list-disc pl-5 text-sm text-slate-700">{opt.unknowns.length ? opt.unknowns.map((u) => <li key={u}>{u}</li>) : <li>No major unknowns flagged.</li>}</ul></div>
                    <div><h4 className="text-sm font-semibold">Imperfect fits</h4><ul className="mt-1 list-disc pl-5 text-sm text-slate-700">{opt.imperfect.length ? opt.imperfect.map((i) => <li key={i}>{i}</li>) : <li>No imperfect-fit notes.</li>}</ul></div>
                    <div><h4 className="text-sm font-semibold">Cost & next step</h4><p className="mt-1 text-sm text-slate-700">{opt.cost ?? "Cost unknown — not invented."}</p><p className="mt-1 text-sm text-slate-700">{opt.next}</p></div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  );
}
