"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { RaguIcon } from "@/components/access-signals/RaguIcon";
import {
  DEMO_ROUTES,
  type AccessDomain,
} from "@/lib/access-signals/demo-data";
import {
  type RaguStatus,
  raguAnnouncement,
} from "@/lib/access-signals/ragu";
import { mapableInteractiveFocusRing } from "@/lib/marketing/mapable-care-tokens";

const STEPS = ["Scope", "Observe", "Evidence", "Review"] as const;
const DOMAINS: { id: AccessDomain; label: string; hint: string }[] = [
  { id: "physical", label: "Physical", hint: "Movement and approach" },
  { id: "sensory", label: "Sensory", hint: "Sight, sound, sensory load" },
  { id: "cognitive", label: "Cognitive", hint: "Wayfinding and information" },
];
const RATINGS: RaguStatus[] = ["red", "amber", "green", "unknown"];

const DRAFT_KEY = "mapable-access-signals-field-notes-draft";

type Draft = {
  domain: AccessDomain;
  rating: RaguStatus;
  note: string;
  routeId: string;
  savedAt: string;
};

export function FieldNotesObserve({
  initialRouteId,
  initialChallenge,
}: {
  initialRouteId?: string;
  initialChallenge?: { title: string; focus: AccessDomain; prompt: string };
}) {
  const route =
    DEMO_ROUTES.find((r) => r.id === initialRouteId) ?? DEMO_ROUTES[0];
  const [domain, setDomain] = useState<AccessDomain>(initialChallenge?.focus ?? "physical");
  const [rating, setRating] = useState<RaguStatus>("unknown");
  const [note, setNote] = useState(
    "Narrow point on the approach. Further measurement needed.",
  );
  const [draftSaved, setDraftSaved] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Draft;
      if (parsed.domain) setDomain(parsed.domain);
      if (parsed.rating) setRating(parsed.rating);
      if (parsed.note) setNote(parsed.note);
      setDraftSaved(true);
      setStatusMessage("Restored local draft. Check its scope before using it for a different challenge.");
    } catch {
      // ignore corrupt draft
    }
  }, []);

  function saveDraft() {
    const payload: Draft = {
      domain,
      rating,
      note,
      routeId: route.id,
      savedAt: new Date().toISOString(),
    };
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
    setDraftSaved(true);
    setStatusMessage("Draft saved locally. Nothing was published.");
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-0 lg:grid-cols-[240px_1fr]">
      <aside className="bg-[#0C1833] px-5 py-8 text-white lg:min-h-[70vh]">
        <h1 className="font-heading text-2xl font-bold">Field Notes</h1>
        <ol className="relative mt-8 space-y-4">
          {STEPS.map((step, index) => {
            const current = index === 1;
            return (
              <li
                key={step}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                  current ? "bg-[#D1FAE5] font-bold text-[#065F46]" : ""
                }`}
              >
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold ${
                    current
                      ? "border-[#065F46] bg-white text-[#065F46]"
                      : "border-white text-white"
                  }`}
                >
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            );
          })}
        </ol>
      </aside>

      <section className="space-y-6 bg-white px-4 py-8 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-3xl font-bold text-[#0C1833]">
              Record an observation
            </h2>
            <p className="mt-1 text-slate-600">
              {route.name} · Entrance approach
            </p>
          </div>
          <p
            className="inline-flex min-h-9 items-center gap-2 rounded-full border border-slate-200 px-3 text-sm text-slate-700"
            role="status"
            aria-live="polite"
          >
            {draftSaved ? "Draft saved locally" : "No local draft yet"}
          </p>
        </div>

        {initialChallenge ? (
          <aside className="space-y-2 rounded-xl border-l-4 border-[#F97316] bg-orange-50 p-4" aria-label="Mapping challenge context">
            <p className="font-bold">Community challenge: {initialChallenge.title}</p>
            <p className="text-sm text-slate-700">Suggested observation: {initialChallenge.prompt}</p>
            <p className="text-sm text-slate-700">This is a fictional exercise. Existing local Field Notes may be restored; check their content and route before saving.</p>
            <Link href="/access-signals/challenges" className={`font-bold text-[#005B7F] underline ${mapableInteractiveFocusRing}`}>Back to challenges</Link>
          </aside>
        ) : null}

        <fieldset className="space-y-3">
          <legend className="font-bold">Domain (what this observation is about)</legend>
          <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Domain">
            {DOMAINS.map((item) => {
              const active = domain === item.id;
              const inputId = `domain-${item.id}`;
              return (
                <div
                  key={item.id}
                  className={`flex min-h-14 items-center gap-3 rounded-xl border-2 px-4 py-3 ${
                    active
                      ? "border-[#059669] bg-[#ECFDF5]"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <input
                    id={inputId}
                    type="radio"
                    name="domain"
                    value={item.id}
                    checked={active}
                    onChange={() => setDomain(item.id)}
                    className="h-5 w-5"
                  />
                  <label htmlFor={inputId} className="cursor-pointer">
                    <span className="block font-bold">{item.label}</span>
                    <span className="block text-sm text-slate-600">{item.hint}</span>
                  </label>
                </div>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="font-bold">
            Observation rating for this route segment
          </legend>
          <div
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
            role="radiogroup"
            aria-label="Observation rating"
          >
            {RATINGS.map((status) => {
              const active = rating === status;
              const inputId = `rating-${status}`;
              return (
                <div
                  key={status}
                  className={`flex min-h-14 items-center gap-3 rounded-xl border-2 px-4 py-3 ${
                    active
                      ? "border-[#059669] bg-[#ECFDF5]"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <input
                    id={inputId}
                    type="radio"
                    name="rating"
                    value={status}
                    checked={active}
                    onChange={() => setRating(status)}
                    className="h-5 w-5"
                  />
                  <label
                    htmlFor={inputId}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <RaguIcon status={status} />
                    <span className="font-bold capitalize">{status}</span>
                  </label>
                </div>
              );
            })}
          </div>
          <p className="text-sm text-slate-600">
            {rating === "unknown"
              ? "Not enough evidence yet."
              : raguAnnouncement(rating)}
          </p>
        </fieldset>

        <label className="block space-y-2">
          <span className="font-bold">What did you observe?</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={`min-h-28 w-full rounded-xl border border-slate-300 px-3 py-3 text-base ${mapableInteractiveFocusRing}`}
          />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <p>
            Source: synthetic example · Observed: 7 Nov 2026
          </p>
          <Link
            href="/access-signals/evidence"
            className={`font-bold text-[#059669] underline ${mapableInteractiveFocusRing}`}
          >
            Add evidence
          </Link>
        </div>

        <p
          className="flex items-start gap-2 rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-950"
          role="note"
        >
          <span aria-hidden className="font-bold">
            i
          </span>
          No real-place rating will be published from this demo.
        </p>

        <div aria-live="polite" className="min-h-6 text-sm text-slate-700">
          {statusMessage}
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={saveDraft}
            className={`inline-flex min-h-11 items-center rounded-xl border border-[#0C1833] px-4 font-bold ${mapableInteractiveFocusRing}`}
          >
            Save draft
          </button>
          <button
            type="button"
            onClick={() => {
              saveDraft();
              setStatusMessage(
                "Draft saved locally. Evidence step is a placeholder in this demo.",
              );
            }}
            className={`inline-flex min-h-11 items-center rounded-xl bg-[#0C1833] px-4 font-bold text-white ${mapableInteractiveFocusRing}`}
          >
            Save and continue
          </button>
        </div>
      </section>
    </div>
  );
}
