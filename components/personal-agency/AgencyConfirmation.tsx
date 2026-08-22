"use client";

import { useEffect } from "react";

import type { AgencyConsequenceKind } from "@/lib/personal-agency/agency-copy";

export type AgencyConfirmationProps = {
  open: boolean;
  title?: string;
  actionLabel: string;
  targetLabel?: string;
  informationShared: string[];
  informationNotShared?: string[];
  costLabel?: string;
  consequenceKinds: AgencyConsequenceKind[];
  onApprove: () => void;
  onChange: () => void;
  onCancel: () => void;
};

const CONSEQUENCE_LABELS: Record<AgencyConsequenceKind, string> = {
  CONTACT: "Contact someone",
  SHARE: "Share information",
  BOOK: "Make or change a booking",
  SPEND: "Spend money",
  AUTHORITY: "Change who can act for you",
};

/** Reusable G4 consequence review — not wired to live execution in this slice. */
export function AgencyConfirmation({
  open,
  title = "Before MapAble does this",
  actionLabel,
  targetLabel,
  informationShared,
  informationNotShared = [],
  costLabel,
  consequenceKinds,
  onApprove,
  onChange,
  onCancel,
}: AgencyConfirmationProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Cancel and close review"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="agency-confirmation-title"
        aria-describedby="agency-confirmation-desc"
        className="relative z-10 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
      >
        <h2
          id="agency-confirmation-title"
          className="text-xl font-bold text-[#0C1833]"
        >
          {title}
        </h2>
        <p
          id="agency-confirmation-desc"
          className="mt-2 text-sm text-slate-600"
        >
          Review what would happen. Nothing proceeds until you approve.
        </p>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="font-semibold text-[#0C1833]">Action</dt>
            <dd>{actionLabel}</dd>
          </div>
          {targetLabel ? (
            <div>
              <dt className="font-semibold text-[#0C1833]">Who</dt>
              <dd>{targetLabel}</dd>
            </div>
          ) : null}
          <div>
            <dt className="font-semibold text-[#0C1833]">
              Information being shared
            </dt>
            <dd>
              {informationShared.length ? (
                <ul className="mt-1 list-disc pl-5">
                  {informationShared.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-slate-600">None</span>
              )}
            </dd>
          </div>
          {informationNotShared.length ? (
            <div>
              <dt className="font-semibold text-[#0C1833]">
                Information not shared
              </dt>
              <dd>
                <ul className="mt-1 list-disc pl-5">
                  {informationNotShared.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </dd>
            </div>
          ) : null}
          {costLabel ? (
            <div>
              <dt className="font-semibold text-[#0C1833]">Cost</dt>
              <dd>{costLabel}</dd>
            </div>
          ) : null}
          <div>
            <dt className="font-semibold text-[#0C1833]">
              Authority consequences
            </dt>
            <dd>
              <ul className="mt-1 space-y-1">
                {consequenceKinds.map((kind) => (
                  <li key={kind} className="font-medium text-[#B45309]">
                    {CONSEQUENCE_LABELS[kind]}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={onApprove}
            className="min-h-11 flex-1 rounded-lg bg-[#F8C51C] px-4 py-2 text-sm font-bold text-[#0C1833] focus:outline-none focus:ring-4 focus:ring-[#005B7F]/30"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={onChange}
            className="min-h-11 flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
          >
            Change
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
