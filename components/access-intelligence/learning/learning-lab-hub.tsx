"use client";

import Link from "next/link";
import React from "react";

import type { LearningScenario } from "@/lib/access-intelligence/learning/schemas";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

const MODES = [
  {
    id: "plan",
    title: "Plan",
    href: "/access-intelligence",
    body: "Return the practical access decision and route directly. Always available — lessons never block planning.",
  },
  {
    id: "guide_me",
    title: "Guide Me",
    href: "/access-intelligence/learn/scenarios?mode=guide_me",
    body: "Explain each step of the decision and inspect evidence.",
  },
  {
    id: "practice",
    title: "Practice",
    href: "/access-intelligence/learn/scenarios",
    body: "Branching fictional scenarios: predict, investigate, decide, revise, teach back, reflect, transfer.",
  },
  {
    id: "facilitate",
    title: "Facilitate",
    href: "/access-intelligence/learn/author",
    body: "Authorised educators present scenarios, pause, collect responses, and debrief.",
  },
] as const;

export function LearningLabHub({ scenarios }: { scenarios: LearningScenario[] }) {
  return (
    <div className="space-y-10">
      <section aria-labelledby="modes-heading">
        <h2 id="modes-heading" className="text-2xl font-black tracking-[-0.03em]">
          Four modes
        </h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {MODES.map((mode) => (
            <li key={mode.id}>
              <a
                href={mode.href}
                className={`block rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-[#F6FBFC] p-5 transition hover:border-[#005B7F] ${mapableCareFocusRing}`}
              >
                <h3 className="text-xl font-black text-[#005B7F]">{mode.title}</h3>
                <p className="mt-2 text-slate-700">{mode.body}</p>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="nav-heading">
        <h2 id="nav-heading" className="text-2xl font-black tracking-[-0.03em]">
          Learning Lab
        </h2>
        <nav aria-label="Learning Lab sections" className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/access-intelligence/learn/scenarios"
            className={`inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-4 text-sm font-black text-white ${mapableCareFocusRing}`}
          >
            Scenarios
          </Link>
          <Link
            href="/access-intelligence/learn/progress"
            className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-black ${mapableCareFocusRing}`}
          >
            Progress
          </Link>
          <Link
            href="/access-intelligence/learn/author"
            className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-black ${mapableCareFocusRing}`}
          >
            Author studio
          </Link>
        </nav>
      </section>

      <section aria-labelledby="featured-heading">
        <h2 id="featured-heading" className="text-2xl font-black tracking-[-0.03em]">
          Published scenarios
        </h2>
        <ul className="mt-4 space-y-3">
          {scenarios.map((s) => (
            <li key={s.id}>
              <a
                href={`/access-intelligence/learn/scenarios/${s.id}`}
                className={`block rounded-xl border border-slate-200 px-4 py-3 hover:border-[#005B7F] ${mapableCareFocusRing}`}
              >
                <span className="font-black">{s.title}</span>
                <span className="mt-1 block text-sm text-slate-600">{s.humanGoal}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm text-slate-500">
        The language model may narrate and hint. It must not change deterministic
        access decisions, invent facts from unknowns, infer capacity from disability,
        award formal competence, or publish unreviewed training content.
      </p>
    </div>
  );
}
