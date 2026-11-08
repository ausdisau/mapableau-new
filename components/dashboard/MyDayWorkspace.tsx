"use client";

import Link from "next/link";
import { useId, useState } from "react";

import { MyDayAiAssistedPanel } from "@/components/dashboard/MyDayAiAssistedPanel";
import {
  MyDayAttentionPanel,
  MyDayComingUpPanel,
  MyDayCommonActions,
  MyDayProgrammaticSidePanel,
} from "@/components/dashboard/MyDayProgrammaticPanel";
import {
  buildAttention,
  type MyDaySnapshot,
} from "@/lib/dashboard/my-day-status";

export type MyDayViewMode = "programmatic" | "assisted";

export function MyDayWorkspace({
  snapshot,
  aiEnabled,
  careOsEnabled,
  roleLabelText,
  showCareOsLink,
}: {
  snapshot: MyDaySnapshot;
  aiEnabled: boolean;
  careOsEnabled: boolean;
  roleLabelText: string;
  showCareOsLink: boolean;
}) {
  const [mode, setMode] = useState<MyDayViewMode>("programmatic");
  const pickerId = useId();
  const attention = buildAttention(snapshot);

  return (
    <div className="space-y-8" data-testid="participant-my-day-workspace">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <header className="max-w-2xl space-y-2">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#005B7F]">
            Your participant workspace
          </p>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-[#0C1833] sm:text-4xl">
            Your day, your choices.
          </h1>
          <p className="text-sm text-slate-600">
            Care, transport and the things that matter to you — presented
            together, with you in control. Signed in as{" "}
            <strong>{roleLabelText}</strong>.
          </p>
        </header>

        <div
          id={pickerId}
          role="group"
          aria-label="Choose dashboard view"
          className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1"
          data-testid="my-day-view-picker"
        >
          <button
            type="button"
            className={`min-h-11 rounded-lg px-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C] ${
              mode === "programmatic"
                ? "bg-[#0C1833] text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
            aria-pressed={mode === "programmatic"}
            onClick={() => setMode("programmatic")}
          >
            Programmatic View
          </button>
          <button
            type="button"
            className={`min-h-11 rounded-lg px-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C] ${
              mode === "assisted"
                ? "bg-[#0C1833] text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
            aria-pressed={mode === "assisted"}
            onClick={() => setMode("assisted")}
          >
            AI-Assisted View
          </button>
        </div>
      </div>

      <div
        className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(265px,1fr)]"
        data-testid="my-day-programmatic"
        data-source={snapshot.source}
      >
        <div className="flex min-w-0 flex-col gap-4">
          <MyDayAttentionPanel attention={attention} />
          <MyDayComingUpPanel snapshot={snapshot} />
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          {mode === "programmatic" ? (
            <MyDayProgrammaticSidePanel
              snapshot={snapshot}
              onPreviewAi={() => setMode("assisted")}
            />
          ) : (
            <MyDayAiAssistedPanel
              enabled={aiEnabled}
              careOsEnabled={careOsEnabled}
              snapshot={snapshot}
              attention={attention}
              onTurnOff={() => setMode("programmatic")}
            />
          )}
        </div>
      </div>

      <MyDayCommonActions />

      <section
        aria-labelledby="more-tools-heading"
        className="rounded-2xl border border-slate-200 bg-white p-5"
      >
        <h2 id="more-tools-heading" className="text-base font-bold text-[#0C1833]">
          More tools
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Legacy deep links remain available. Use the left navigation for
          everyday paths.
        </p>
        <ul className="mt-4 flex flex-wrap gap-3 text-sm">
          <li>
            <Link
              className="font-bold text-[#005B7F] underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C]"
              href="/dashboard/billing"
            >
              Billing centre
            </Link>
          </li>
          <li>
            <Link
              className="font-bold text-[#005B7F] underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C]"
              href="/dashboard/notifications"
            >
              Notifications
            </Link>
          </li>
          <li>
            <Link
              className="font-bold text-[#005B7F] underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C]"
              href="/dashboard/jobs"
            >
              Jobs
            </Link>
          </li>
          <li>
            <Link
              className="font-bold text-[#005B7F] underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C]"
              href="/dashboard/calendar"
            >
              Calendar
            </Link>
          </li>
          {showCareOsLink ? (
            <li>
              <Link
                className="font-bold text-[#005B7F] underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C]"
                href="/dashboard/careos"
              >
                My CareOS
              </Link>
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
