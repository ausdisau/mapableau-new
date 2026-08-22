"use client";

import type { LifeIntentStatus } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AssistantShell } from "@/components/personal-agency/AssistantShell";
import { EvidenceDrawer } from "@/components/personal-agency/EvidenceDrawer";

const EXPLORATION_AREAS = [
  "Accessibility",
  "Transport",
  "Support",
  "Work/study",
] as const;

const STATUS_OPTIONS: LifeIntentStatus[] = [
  "EXPLORING",
  "PLANNING",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
];

export function LifeIntentDetailClient({
  intent,
}: {
  intent: {
    id: string;
    originalExpression: string;
    status: LifeIntentStatus;
  };
}) {
  const router = useRouter();
  const [status, setStatus] = useState(intent.status);
  const [savedLabel, setSavedLabel] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function saveExploration(label: string) {
    setPending(true);
    try {
      const res = await fetch(`/api/my/life-intents/${intent.id}/explore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      if (res.ok) {
        setSavedLabel(label);
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  async function updateStatus(next: LifeIntentStatus) {
    setStatus(next);
    await fetch(`/api/my/life-intents/${intent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-10">
      <header>
        <Link href="/my/life" className="text-sm font-semibold text-[#005B7F]">
          ← My Life
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Your intent</h1>
      </header>

      <section
        aria-labelledby="your-words-heading"
        className="rounded-xl border border-slate-200 bg-white p-6"
      >
        <h2
          id="your-words-heading"
          className="text-sm font-bold uppercase tracking-wide text-[#005B7F]"
        >
          Your words
        </h2>
        <p className="mt-3 text-lg italic text-[#0C1833]">
          &ldquo;{intent.originalExpression}&rdquo;
        </p>
        <label
          htmlFor="intent-status"
          className="mt-4 block text-sm font-semibold"
        >
          Status
        </label>
        <select
          id="intent-status"
          value={status}
          onChange={(e) =>
            void updateStatus(e.target.value as LifeIntentStatus)
          }
          className="mt-1 min-h-11 rounded-lg border border-slate-300 px-3 py-2"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </section>

      <section aria-labelledby="exploring-heading">
        <h2 id="exploring-heading" className="text-xl font-bold">
          What I&apos;m exploring
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Nothing happens until you choose.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {EXPLORATION_AREAS.map((area) => (
            <li key={area}>
              <button
                type="button"
                disabled={pending}
                onClick={() => void saveExploration(area)}
                className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
              >
                {area}
              </button>
            </li>
          ))}
        </ul>
        {savedLabel ? (
          <p role="status" className="mt-3 text-sm text-[#005B7F]">
            Saved &ldquo;{savedLabel}&rdquo; — view in{" "}
            <Link href="/my/control/activity" className="underline">
              Agency activity
            </Link>
            .
          </p>
        ) : null}
      </section>

      <section aria-labelledby="assistant-section">
        <h2 id="assistant-section" className="sr-only">
          Explore with MapAble Assistant
        </h2>
        <AssistantShell
          lifeIntentId={intent.id}
          initialPrompt={`Help me explore: ${intent.originalExpression}`}
        />
      </section>

      <EvidenceDrawer
        triggerLabel="See how evidence works here"
        items={[
          {
            id: "sample-unknown",
            label: "Options shown by assistant",
            state: "unknown",
            detail: "Based on search — not verified accessibility fact",
          },
        ]}
      />
    </div>
  );
}
