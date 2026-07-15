"use client";

import Link from "next/link";
import React, { useState } from "react";

import { LEARNING_OBJECTIVES } from "@/lib/access-intelligence/learning/scenarios";
import type {
  ContentReview,
  LearningScenario,
} from "@/lib/access-intelligence/learning/schemas";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export function AuthorStudio({
  initialScenarios,
  initialReviews,
}: {
  initialScenarios: LearningScenario[];
  initialReviews: ContentReview[];
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [reviews, setReviews] = useState(initialReviews);
  const [audience, setAudience] = useState("individual");
  const [title, setTitle] = useState("");
  const [facilSessionId, setFacilSessionId] = useState<string | null>(null);

  async function saveDraft() {
    const draft = {
      id: `draft-${Date.now()}`,
      title: title || "Untitled scenario draft",
      humanGoal: "Author-defined human goal",
      placeId: "place-harbour-civic",
      destination: "Author destination",
      passportId: "passport-step-free",
      objectiveIds: [LEARNING_OBJECTIVES[0]!.id],
      audience: [audience],
      stages: [
        {
          id: "st-o",
          stage: "orientation",
          title: "Orientation",
          prompt: "Author preview orientation with text map alternative.",
        },
      ],
      decisionPoints: [
        {
          id: "dp-1",
          prompt: "Choose",
          options: [
            {
              id: "opt-a",
              label: "Expected",
              predictedStatus: "suitable_with_conditions",
            },
            {
              id: "opt-b",
              label: "Incorrect",
              predictedStatus: "suitable",
            },
          ],
          expectedOptionId: "opt-a",
          rationale: "Author rationale",
        },
      ],
      dynamicEvents: [],
      evidenceIds: ["ev-lift-verified"],
      unknownHighlights: ["Author unknown"],
      expectedReasoning: ["Author expected reasoning"],
      formativeFeedback: { good: "Good", needs_work: "Needs work" },
      teachBackPrompt: "Explain your reasoning",
      teachBackKeywords: ["verified", "unknown"],
      reflectionPrompts: ["What did you learn?"],
      transferTask: {
        title: "Transfer",
        instructions: "Apply elsewhere",
        successCriteria: ["Names unknown"],
      },
      rubric: [
        {
          id: "rc-1",
          dimension: "evidence_reasoning",
          description: "Evidence",
          expectedBehaviours: ["Inspect status"],
          weight: 1,
        },
      ],
      published: false,
      version: "0.1.0-draft",
      author: "Author Studio",
      jurisdiction: "AU",
      sourceMaterial: [],
    };
    const res = await fetch("/api/access-intelligence/learn/author", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = await res.json();
    setMessage(data.note ?? data.error ?? "Saved");
  }

  async function scheduleReview(scenarioId: string, reviewType: ContentReview["reviewType"]) {
    const res = await fetch("/api/access-intelligence/learn/author", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "schedule_review",
        scenarioId,
        reviewType,
        reviewerName: `${reviewType} reviewer`,
      }),
    });
    const data = await res.json();
    if (data.review) setReviews((r) => [...r, data.review]);
    setMessage(`Review requested: ${reviewType}`);
  }

  async function startFacilitate(scenarioId: string) {
    const res = await fetch("/api/access-intelligence/learn/facilitate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenarioId, anonymousResponses: true }),
    });
    const data = await res.json();
    if (data.session) {
      setFacilSessionId(data.session.id);
      window.location.href = `/access-intelligence/learn/facilitate/${data.session.id}`;
    } else {
      setMessage(data.error ?? "Could not start facilitation");
    }
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="author-build-heading" className="space-y-4">
        <h2 id="author-build-heading" className="text-2xl font-black">
          Build scenario draft
        </h2>
        <p className="text-slate-600">
          Define objectives, audience, evidence, branches, dynamic events, and rubric
          rules. Generated content stays unpublished until required reviews approve.
        </p>
        <label className="block font-semibold">
          Title
          <input
            className={`mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal ${mapableCareFocusRing}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="block font-semibold">
          Audience
          <select
            className={`mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal ${mapableCareFocusRing}`}
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
          >
            <option value="individual">Individual</option>
            <option value="family">Family</option>
            <option value="workforce">Workforce</option>
            <option value="community">Community</option>
          </select>
        </label>
        <fieldset className="rounded-xl border border-slate-200 p-4">
          <legend className="px-1 font-bold">Objectives catalogue</legend>
          <ul className="space-y-1 text-sm text-slate-700">
            {LEARNING_OBJECTIVES.map((o) => (
              <li key={o.id}>
                <strong>{o.title}</strong> — {o.description}
              </li>
            ))}
          </ul>
        </fieldset>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className={`min-h-11 rounded-xl bg-[#005B7F] px-4 font-black text-white ${mapableCareFocusRing}`}
            onClick={() => void saveDraft()}
          >
            Save unpublished draft
          </button>
          <Link
            href="/access-intelligence/learn/scenarios/interview-level-three?preview=1"
            className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 font-black ${mapableCareFocusRing}`}
          >
            Preview accessible format
          </Link>
        </div>
        {message ? (
          <p role="status" className="text-slate-700">
            {message}
          </p>
        ) : null}
      </section>

      <section aria-labelledby="published-heading">
        <h2 id="published-heading" className="text-2xl font-black">
          Scenarios & review
        </h2>
        <ul className="mt-4 space-y-4">
          {initialScenarios.map((s) => (
            <li key={s.id} className="rounded-xl border border-slate-200 p-4">
              <p className="font-black">{s.title}</p>
              <p className="text-sm text-slate-600">
                v{s.version} · {s.published ? "published" : "draft"} · author{" "}
                {s.author}
                {s.accessibilityReviewer
                  ? ` · a11y ${s.accessibilityReviewer}`
                  : ""}
                {s.livedExperienceReviewer
                  ? ` · lived experience ${s.livedExperienceReviewer}`
                  : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-bold ${mapableCareFocusRing}`}
                  onClick={() => void scheduleReview(s.id, "lived_experience")}
                >
                  Request lived-experience review
                </button>
                <button
                  type="button"
                  className={`min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-bold ${mapableCareFocusRing}`}
                  onClick={() => void scheduleReview(s.id, "accessibility")}
                >
                  Request accessibility review
                </button>
                <button
                  type="button"
                  className={`min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-bold ${mapableCareFocusRing}`}
                  onClick={() => void startFacilitate(s.id)}
                >
                  Facilitate session
                </button>
              </div>
            </li>
          ))}
        </ul>
        {facilSessionId ? (
          <p className="mt-2 text-sm">Opening session {facilSessionId}…</p>
        ) : null}
      </section>

      <section aria-labelledby="reviews-heading">
        <h2 id="reviews-heading" className="text-xl font-black">
          Content reviews
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          {reviews.length === 0 ? (
            <li className="text-slate-500">No reviews queued.</li>
          ) : (
            reviews.map((r) => (
              <li key={r.id}>
                {r.reviewType} · {r.status} · {r.reviewerName} ({r.scenarioId})
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
