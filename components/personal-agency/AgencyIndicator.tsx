"use client";

import { useId, useState } from "react";

import {
  AGENCY_CAN,
  AGENCY_MUST_ASK,
  AGENCY_NEVER,
} from "@/lib/personal-agency/agency-copy";

export function AgencyIndicator() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonId = useId();

  return (
    <div className="relative">
      <button
        id={buttonId}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-[#005B7F]/30 bg-white px-3 py-1.5 text-sm font-semibold text-[#005B7F] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
      >
        <span aria-hidden className="h-2 w-2 rounded-full bg-[#005B7F]" />
        Agency
      </button>
      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-labelledby={`${panelId}-title`}
          className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
        >
          <h2
            id={`${panelId}-title`}
            className="text-base font-bold text-[#0C1833]"
          >
            Your agency
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            MapAble can suggest and organise options. You decide what happens
            next.
          </p>
          <section className="mt-4" aria-label="MapAble may">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#005B7F]">
              MapAble may
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              {AGENCY_CAN.map((item) => (
                <li key={item}>✓ {item}</li>
              ))}
            </ul>
          </section>
          <section className="mt-4" aria-label="MapAble must ask before">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#B45309]">
              MapAble must ask before
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              {AGENCY_MUST_ASK.map((item) => (
                <li key={item}>! {item}</li>
              ))}
            </ul>
          </section>
          <section className="mt-4" aria-label="MapAble never">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
              MapAble never
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              {AGENCY_NEVER.map((item) => (
                <li key={item}>× {item}</li>
              ))}
            </ul>
          </section>
          <a
            href="/my/control"
            className="mt-4 inline-flex w-full justify-center rounded-lg bg-[#005B7F] px-3 py-2 text-sm font-semibold text-white hover:bg-[#004A66] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
          >
            Manage control
          </a>
          <button
            type="button"
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </div>
      ) : null}
    </div>
  );
}
