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
type Finding = {
  id: string;
  challengeId: string;
  title: string;
  feature: string;
  finding: string;
  observedAt: string;
  evidenceState: string;
  rating: string;
  moderation?: string;
  consentScope?: string;
};
type ConsentScope = "private" | "review" | "public";

async function readApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", credentials: "same-origin", ...options });
  const result = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(result.error ?? "Could not complete this request");
  return result;
}

const fieldClass =
  "block w-full min-h-11 rounded-lg border border-slate-400 bg-white px-3 py-2 text-slate-950 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-amber-500";
const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0c2043] px-5 py-2 font-semibold text-white hover:bg-[#243e6e] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-amber-500 disabled:cursor-not-allowed disabled:opacity-60";

export default function CommunityLiveApp() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [published, setPublished] = useState<Finding[]>([]);
  const [mine, setMine] = useState<Finding[]>([]);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState("");
  const [loadError, setLoadError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState("");
  const [title, setTitle] = useState("");
  const [feature, setFeature] = useState("Entrance / door");
  const [finding, setFinding] = useState("");
  const [method, setMethod] = useState("direct observation");
  const [observedAt, setObservedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [consentScope, setConsentScope] = useState<ConsentScope>("private");
  const [acknowledged, setAcknowledged] = useState(false);

  const refresh = useCallback(async () => {
    setLoadError("");
    try {
      const [c, p] = await Promise.all([
        readApi<{ challenges: Challenge[] }>("/api/community/live/challenges"),
        readApi<{ observations: Finding[] }>("/api/community/live/observations"),
      ]);
      setChallenges(c.challenges);
      setChallengeId(prev =>
        c.challenges.some(challenge => challenge.id === prev) ? prev : (c.challenges[0]?.id ?? "")
      );
      setPublished(p.observations);
      try {
        const own = await readApi<{ observations: Finding[] }>("/api/community/live/observations?mine=1");
        setMine(own.observations);
        setSignedIn(true);
      } catch (error) {
        if (error instanceof Error && error.message === "Sign in required") {
          setSignedIn(false);
          setMine([]);
        } else {
          throw error;
        }
      }
    } catch {
      setLoadError("Community information is temporarily unavailable. No changes have been submitted.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function submitFinding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!acknowledged || !challengeId) return;
    setNotice("");
    setWorking(true);
    try {
      await readApi("/api/community/live/observations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId, title, feature, finding, method, observedAt,
          consentScope, consentAcknowledged: true,
        }),
      });
      setNotice("Observation received. It is not publicly visible or independently verified. You can review and remove it below.");
      setTitle("");
      setFinding("");
      setConsentScope("private");
      setAcknowledged(false);
      await refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Submission was not saved. Please try again.");
    } finally {
      setWorking(false);
    }
  }

  async function removeFinding(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setNotice("");
    setWorking(true);
    try {
      await readApi("/api/community/live/observations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotice("Observation content removed from the community records. A minimal administrative audit entry remains.");
      setConfirmDeleteId(null);
      await refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Removal could not be completed.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <main id="main-content" className="mx-auto max-w-6xl space-y-8 px-4 py-10 text-slate-900">
      <header className="rounded-3xl bg-[#0c2043] px-6 py-9 text-white md:px-10">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-amber-300">
          MapAble Core · Community &amp; Access
        </p>
        <h1 className="mt-3 text-3xl font-black md:text-5xl">Community Mapping Challenges</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed">
          Share an access experience, help identify missing information, and choose
          exactly how your contribution can be reviewed. Your voice matters; you control
          whether your observation is private, available to moderators, or proposed for publication.
        </p>
      </header>

      <div role="note" className="rounded-2xl border-2 border-amber-500 bg-amber-50 p-5">
        <p className="font-bold">Important: community observations are not verified accessibility guarantees.</p>
        <p className="mt-2 text-sm leading-6">
          Published findings receive human content review, not engineering certification.
          Confirm critical access needs with relevant services before travelling.
          MapAble Community is not an emergency reporting service.
          No personal medical information, photographs, GPS location or files are required here.
        </p>
      </div>

      {notice ? <p role="status" aria-live="polite" className="rounded-xl border border-blue-400 bg-blue-50 p-4">{notice}</p> : null}
      {loadError ? <p role="alert" className="rounded-xl border border-red-500 bg-red-50 p-4">{loadError} <button type="button" className="underline" onClick={() => void refresh()}>Retry</button></p> : null}
      {loading ? <p role="status">Loading community information…</p> : null}

      <section aria-labelledby="challenges-heading" className="space-y-4">
        <h2 id="challenges-heading" className="text-2xl font-bold">Active mapping challenges</h2>
        {!loading && challenges.length === 0 ? (
          <p className="rounded-xl border border-slate-300 p-5">No mapping challenges are published yet. This is not a sample-data list.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {challenges.map(challenge => (
              <article key={challenge.id} className="rounded-2xl border border-slate-300 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-600">{challenge.template}</p>
                <h3 className="mt-2 text-xl font-bold">{challenge.title}</h3>
                <p className="mt-2 text-sm"><strong>Area:</strong> {challenge.boundary}</p>
                <p className="mt-2 leading-6">{challenge.instruction}</p>
                <button type="button" className="mt-4 min-h-11 rounded-lg border-2 border-[#0c2043] px-4 font-semibold focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-amber-500"
                  onClick={() => { setChallengeId(challenge.id); document.getElementById("community-observation-title")?.focus(); }}>
                  Contribute to this challenge
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="community-contribute-heading" className="rounded-2xl border border-slate-300 bg-slate-50 p-5 md:p-8">
        <h2 id="community-contribute-heading" className="text-2xl font-bold">Record an accessibility observation</h2>
        <p className="mt-2 leading-6">
          You can type, paste, dictate using your device or choose the suggested AAC phrases below.
          Submissions begin as reported information, with an <strong>Unknown</strong> access classification.
        </p>
        {signedIn === false ? (
          <p className="mt-4"><a className="inline-flex min-h-11 items-center font-bold underline focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-amber-500" href="/login?callbackUrl=%2Fcommunity">Sign in to contribute and manage your submissions</a></p>
        ) : null}
        <form onSubmit={submitFinding} className="mt-6 grid max-w-3xl gap-5">
          <div>
            <label htmlFor="community-challenge" className="mb-1 block font-semibold">Select a published challenge</label>
            <select className={fieldClass} id="community-challenge" value={challengeId} required onChange={e => setChallengeId(e.target.value)}>
              <option value="">Choose a challenge</option>
              {challenges.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="community-observation-title" className="mb-1 block font-semibold">Observation title</label>
            <input id="community-observation-title" className={fieldClass} type="text" required minLength={2} maxLength={160} value={title}
              onChange={e => setTitle(e.target.value)} placeholder="For example: entrance step at a community venue" />
          </div>
          <div>
            <label htmlFor="community-feature" className="mb-1 block font-semibold">What feature did you observe?</label>
            <select id="community-feature" className={fieldClass} value={feature} onChange={e => setFeature(e.target.value)}>
              {["Entrance / door", "Path / surface", "Crossing / kerb ramp", "Lift / ramp", "Accessible toilet", "Communication / AAC", "Sensory environment", "Wayfinding / signage", "Public transport", "Other"].map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="community-finding" className="mb-1 block font-semibold">What did you observe?</label>
            <textarea id="community-finding" className={fieldClass} value={finding} required minLength={12} maxLength={2000} rows={5}
              onChange={e => setFinding(e.target.value)} placeholder="Describe what you saw, when, and what you could or could not use." />
            <p className="mt-2 text-sm text-slate-600">Please do not include names, diagnoses, contact details or precise private addresses.</p>
            <div className="mt-3 flex flex-wrap gap-2" aria-label="Optional quick communication phrases">
              {["I could not enter because ", "I used another entrance because ", "I needed communication support because "].map(phrase => (
                <button type="button" key={phrase} className="min-h-11 rounded-lg border border-slate-400 bg-white px-3 text-sm font-medium focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-amber-500"
                  onClick={() => setFinding(prev => prev ? prev + " " + phrase : phrase)}>{phrase.trim()}</button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="community-method" className="mb-1 block font-semibold">Evidence method</label>
              <select id="community-method" className={fieldClass} value={method} onChange={e => setMethod(e.target.value)}>
                {["direct observation", "measurement", "community report", "operator report", "document review"].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="community-observed-date" className="mb-1 block font-semibold">Date observed</label>
              <input id="community-observed-date" className={fieldClass} type="date" required value={observedAt} max={new Date().toISOString().slice(0,10)} onChange={e => setObservedAt(e.target.value)} />
            </div>
          </div>
          <fieldset className="space-y-3 rounded-xl border border-slate-400 p-4">
            <legend className="px-2 font-bold">Your sharing decision</legend>
            {([
              ["private", "Private to me", "Only your signed-in account can read it. No moderation or publication."],
              ["review", "Share with moderators only", "Reviewers can read it, but it cannot be published."],
              ["public", "Consider for public publication", "Human moderators may approve it for public viewing without identifying account details."] ,
            ] as const).map(([scope, label, description]) => (
              <label key={scope} className="flex min-h-11 cursor-pointer gap-3 rounded-lg p-2 hover:bg-white">
                <input type="radio" name="scope" className="mt-1 size-5 accent-[#0c2043]" checked={consentScope === scope} onChange={() => setConsentScope(scope)} />
                <span><strong>{label}</strong><span className="mt-1 block text-sm text-slate-600">{description}</span></span>
              </label>
            ))}
          </fieldset>
          <label className="flex items-start gap-3">
            <input type="checkbox" className="mt-1 size-5 accent-[#0c2043]" checked={acknowledged} required onChange={e => setAcknowledged(e.target.checked)} />
            <span>I understand this sharing choice. I can later remove my submission content; minimal system audit metadata may be retained.</span>
          </label>
          <button type="submit" className={buttonClass} disabled={working || !signedIn || !challengeId || challenges.length === 0}>
            {working ? "Saving…" : "Submit observation with my chosen privacy setting"}
          </button>
        </form>
      </section>

      <section aria-labelledby="my-community-heading" className="space-y-4">
        <h2 id="my-community-heading" className="text-2xl font-bold">My submitted observations</h2>
        {signedIn === false ? <p>Sign in to view your private records.</p> : mine.length === 0 ? <p>No saved submissions are associated with your account.</p> : (
          <div className="grid gap-4">
            {mine.map(record => (
              <article key={record.id} className="rounded-2xl border border-slate-300 p-4">
                <h3 className="font-bold">{record.title}</h3>
                <p className="mt-1 text-sm">Consent: {record.consentScope}. Moderation: {record.moderation}. Access classification: Unknown until independently evidenced.</p>
                <p className="mt-2 whitespace-pre-wrap">{record.finding}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button className={buttonClass} disabled={working} type="button" onClick={() => void removeFinding(record.id)}>
                    {confirmDeleteId === record.id ? "Confirm removal of submission content" : "Remove my observation"}
                  </button>
                  {confirmDeleteId === record.id ? <button type="button" className="min-h-11 px-4 underline" onClick={() => setConfirmDeleteId(null)}>Cancel</button> : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="published-heading" className="space-y-4">
        <h2 id="published-heading" className="text-2xl font-bold">Human-reviewed public contributions</h2>
        <p className="text-sm leading-6">These community reports are not independent verification, compliance certificates or recommendations that a route is suitable for everyone.</p>
        {published.length === 0 ? <p>No public contributions have completed consent and human content review.</p> : (
          <div className="grid gap-4 md:grid-cols-2">
            {published.map(item => (
              <article key={item.id} className="rounded-xl border border-slate-300 bg-white p-5">
                <h3 className="font-bold">{item.title}</h3>
                <p className="mt-2 text-sm"><strong>Feature:</strong> {item.feature}; <strong>Observed:</strong> {item.observedAt.slice(0, 10)}</p>
                <p className="mt-2 whitespace-pre-wrap">{item.finding}</p>
                <p className="mt-3 text-sm font-semibold text-amber-800">Community reported · Reviewed for publication · Access status unknown</p>
              </article>
            ))}
          </div>
        )}
      </section>
      <footer className="border-t border-slate-300 pt-5 text-sm text-slate-700">
        <p>MapAble Community does not determine NDIS eligibility, publish medical records or replace independent accessibility assessment.</p>
        <p className="mt-2">Community moderators: <a className="underline" href="/community/manage">moderation workspace</a>.</p>
      </footer>
    </main>
  );
}
