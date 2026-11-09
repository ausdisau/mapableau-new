"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type Challenge = {
  id: string;
  title: string;
  template: string;
  boundary: string;
  instruction: string;
  status: string;
};
type ModerationItem = {
  id: string;
  title: string;
  feature: string;
  finding: string;
  method: string;
  observedAt: string;
  evidenceState: string;
  moderation: string;
  consentScope: "review" | "public";
  canReview: boolean;
  challenge: { status: string; title: string };
};

const actionClass = "inline-flex min-h-11 items-center rounded-xl border-2 border-[#0c2043] bg-white px-4 font-semibold text-[#0c2043] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-amber-500 disabled:cursor-not-allowed disabled:opacity-40";
const inputClass = "block min-h-11 w-full rounded-xl border border-slate-500 bg-white px-3 py-2 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-amber-500";

async function api<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, { ...options, credentials: "same-origin", cache: "no-store" });
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? "Request failed");
  return body;
}

export default function CommunityLiveAdmin({ pilotMode = false }: { pilotMode?: boolean }) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [queue, setQueue] = useState<ModerationItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [template, setTemplate] = useState("street");
  const [boundary, setBoundary] = useState("");
  const [instruction, setInstruction] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [confirmPublishId, setConfirmPublishId] = useState<string | null>(null);
  const [confirmModerationId, setConfirmModerationId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [c, m] = await Promise.all([
        api<{ challenges: Challenge[] }>("/api/community/live/challenges?includeDrafts=1"),
        api<{ queue: ModerationItem[] }>("/api/community/live/moderation"),
      ]);
      setChallenges(c.challenges);
      setQueue(m.queue);
      setError("");
    } catch {
      setError("Could not load the moderation workspace. No changes have been made.");
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function createChallenge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await api("/api/community/live/challenges", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, template, boundary, instruction }),
      });
      setTitle(""); setBoundary(""); setInstruction("");
      setMessage("Challenge created as a private draft. It has not been published.");
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not create draft.");
    } finally { setBusy(false); }
  }

  async function publishChallenge(id: string) {
    if (confirmPublishId !== id) { setConfirmPublishId(id); return; }
    setBusy(true);
    setMessage("");
    try {
      await api("/api/community/live/challenges", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, confirmPublish: true }),
      });
      setConfirmPublishId(null);
      setMessage(pilotMode ? "Challenge is available to invited pilot accounts only." : "Challenge published. It is available for new contributions.");
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not publish challenge.");
    } finally { setBusy(false); }
  }

  async function decide(id: string, decision: "approved" | "rejected" | "needs_info") {
    const confirmationKey = id + ":" + decision;
    if (confirmModerationId !== confirmationKey) { setConfirmModerationId(confirmationKey); return; }
    setBusy(true);
    setMessage("");
    try {
      await api("/api/community/live/moderation", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, decision, note: notes[id] ?? "" }),
      });
      setConfirmModerationId(null);
      setMessage(decision === "approved"
        ? "Community report approved for publication. This is not an independent accessibility verification."
        : "Review decision recorded.");
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Review could not be recorded.");
    } finally { setBusy(false); }
  }

  return (
    <main id="main-content" className="mx-auto max-w-5xl space-y-8 px-4 py-10 text-slate-900">
      <header>
        <a className="inline-flex min-h-11 items-center font-semibold underline" href="/community">Return to Community</a>
        <h1 className="mt-3 text-3xl font-black">Community moderation workspace</h1>
        <p className="mt-2 max-w-3xl leading-6">Authorised MapAble administrators only. Reviewing a community contribution checks its suitability for publication, not factual accuracy or accessibility certification.</p>
      </header>
      <div className="rounded-xl border-2 border-amber-600 bg-amber-50 p-4" role="note">
        <strong>Review instructions:</strong> Check for names, addresses, identifying details, allegations, threats and sensitive information. Reject inappropriate material; never approve your own submission. Reports marked “moderator review only” must not become public. Resolve urgent safety concerns through appropriate human processes, not automated ratings.
      </div>
      {pilotMode ? (
        <div className="rounded-xl border-2 border-amber-600 bg-amber-50 p-4" role="note">
          <strong>Private pilot moderation:</strong> You can request more information or
          reject submitted reports. Public approval is disabled until a separate,
          reviewed production release. Use test information only.
        </div>
      ) : null}
      {message ? <p role="status" aria-live="polite" className="rounded-xl border border-blue-300 bg-blue-50 p-4">{message}</p> : null}
      {error ? <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4">{error} <button type="button" onClick={() => void refresh()} className="underline">Retry</button></p> : null}

      <section className="rounded-2xl border border-slate-300 p-5" aria-labelledby="create-community-challenge">
        <h2 id="create-community-challenge" className="text-2xl font-bold">Create an unpublished challenge</h2>
        <form onSubmit={createChallenge} className="mt-5 grid gap-4">
          <label className="block font-semibold">Challenge title
            <input className={inputClass} type="text" required minLength={2} maxLength={160} value={title} onChange={e => setTitle(e.target.value)} />
          </label>
          <label className="block font-semibold">Challenge type
            <select className={inputClass} value={template} onChange={e => setTemplate(e.target.value)}>
              {["street", "journey", "venue", "crossing", "sensory", "temporary"].map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="block font-semibold">Area or scope (public description only)
            <input className={inputClass} required minLength={2} maxLength={200} value={boundary} onChange={e => setBoundary(e.target.value)} />
          </label>
          <label className="block font-semibold">Clear instructions and scope limitations
            <textarea className={inputClass} rows={4} required minLength={12} maxLength={1200} value={instruction} onChange={e => setInstruction(e.target.value)} />
          </label>
          <button className={actionClass} disabled={busy} type="submit">Save draft challenge</button>
        </form>
      </section>

      <section aria-labelledby="manage-challenges" className="space-y-3">
        <h2 id="manage-challenges" className="text-2xl font-bold">Challenge publication</h2>
        {challenges.length === 0 ? <p>No challenges are connected.</p> : challenges.map(challenge => (
          <article key={challenge.id} className="rounded-xl border border-slate-300 p-4">
            <h3 className="font-bold">{challenge.title}</h3>
            <p className="mt-1 text-sm">Status: {challenge.status}. Scope: {challenge.boundary}.</p>
            {challenge.status === "draft" ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <button disabled={busy} type="button" className={actionClass} onClick={() => void publishChallenge(challenge.id)}>
                  {confirmPublishId === challenge.id ? "Confirm publish challenge" : "Review and publish"}
                </button>
                {confirmPublishId === challenge.id ? <button type="button" className={actionClass} onClick={() => setConfirmPublishId(null)}>Cancel</button> : null}
              </div>
            ) : <p className="mt-2 text-sm font-semibold text-green-800">Published for community contributions</p>}
          </article>
        ))}
      </section>

      <section aria-labelledby="moderation-queue" className="space-y-4">
        <h2 id="moderation-queue" className="text-2xl font-bold">Pending human reviews</h2>
        {queue.length === 0 ? <p>No contributions are awaiting review.</p> : queue.map(item => (
          <article key={item.id} className="rounded-xl border border-slate-400 bg-white p-5">
            <h3 className="text-lg font-bold">{item.title}</h3>
            <p className="mt-1 text-sm">
              Challenge: {item.challenge.title}. Consent: <strong>{item.consentScope}</strong>.
              Method: {item.method}. Observed: {item.observedAt.slice(0, 10)}.
            </p>
            <p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-100 p-4">{item.finding}</p>
            <label className="mt-3 block font-semibold" htmlFor={"review-note-" + item.id}>
              Review note (do not include identifying details)
            </label>
            <textarea id={"review-note-" + item.id} className={inputClass} maxLength={400} rows={3} value={notes[item.id] ?? ""} onChange={e => setNotes(prev => ({ ...prev, [item.id]: e.target.value }))} />
            {!item.canReview ? <p className="mt-3 font-bold text-amber-800">Independent reviewer required: you cannot review your own contribution.</p> : null}
            {item.consentScope === "review" ? <p className="mt-3 text-sm font-semibold">Review only: publication is not permitted by this consent setting.</p> : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {(["approved", "needs_info", "rejected"] as const).map(decision => (
                <button key={decision} className={actionClass} type="button" disabled={busy || !item.canReview || (decision === "approved" && (pilotMode || item.consentScope !== "public"))}
                  onClick={() => void decide(item.id, decision)}>
                  {confirmModerationId === item.id + ":" + decision ? "Confirm " + decision : decision === "approved" ? "Approve publication" : decision === "needs_info" ? "Request more information" : "Reject"}
                </button>
              ))}
              {confirmModerationId?.startsWith(item.id + ":") ? (
                <button className={actionClass} type="button" onClick={() => setConfirmModerationId(null)}>Cancel action</button>
              ) : null}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
