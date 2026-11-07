"use client";

import Link from "next/link";

import type {
  PersonaEditableDraft,
  PersonaPresentationPrefs,
} from "@/lib/virtual-persona/types";

export function ControlPanel({
  prefs,
  draft,
  onPrefsChange,
  onEditDraft,
  onRejectDraft,
  onUpdateDraft,
  onNonAi,
  onHumanSupport,
}: {
  prefs: PersonaPresentationPrefs;
  draft: PersonaEditableDraft | null;
  onPrefsChange: (prefs: Partial<PersonaPresentationPrefs>) => void;
  onEditDraft: () => void;
  onRejectDraft: () => void;
  onUpdateDraft: (body: string) => void;
  onNonAi: () => void;
  onHumanSupport: () => void;
}) {
  return (
    <section
      aria-labelledby="vp-control-heading"
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-4"
    >
      <h2 id="vp-control-heading" className="text-base font-bold text-[#0C1833]">
        Your controls
      </h2>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-[#0C1833]">
          AI assistance
        </legend>
        <label className="flex min-h-11 items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-5 w-5"
            checked={prefs.useAiAssistance}
            onChange={(event) =>
              onPrefsChange({ useAiAssistance: event.target.checked })
            }
          />
          Use AI-assisted replies (synthetic demo only)
        </label>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-[#0C1833]">
          Reading complexity
        </legend>
        {(
          [
            ["plain", "Plain"],
            ["standard", "Standard"],
            ["detailed", "Detailed"],
          ] as const
        ).map(([value, label]) => (
          <label
            key={value}
            className="flex min-h-11 items-center gap-2 text-sm text-slate-700"
          >
            <input
              type="radio"
              name="vp-complexity"
              className="h-5 w-5"
              checked={prefs.readingComplexity === value}
              onChange={() => onPrefsChange({ readingComplexity: value })}
            />
            {label}
          </label>
        ))}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-[#0C1833]">
          Response length
        </legend>
        {(
          [
            ["short", "Short"],
            ["medium", "Medium"],
          ] as const
        ).map(([value, label]) => (
          <label
            key={value}
            className="flex min-h-11 items-center gap-2 text-sm text-slate-700"
          >
            <input
              type="radio"
              name="vp-length"
              className="h-5 w-5"
              checked={prefs.responseLength === value}
              onChange={() => onPrefsChange({ responseLength: value })}
            />
            {label}
          </label>
        ))}
      </fieldset>

      {draft ? (
        <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <h3 className="text-sm font-semibold text-[#0C1833]">{draft.title}</h3>
          <label className="block text-sm text-slate-700" htmlFor="vp-draft-body">
            Editable draft (not sent)
          </label>
          <textarea
            id="vp-draft-body"
            className="w-full min-h-[6rem] rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/50"
            value={draft.body}
            onFocus={onEditDraft}
            onChange={(event) => onUpdateDraft(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onRejectDraft}
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#0C1833] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/50"
            >
              Reject draft
            </button>
          </div>
          <p className="text-xs text-slate-600">
            executable: false — this draft cannot book, pay, or change
            permissions.
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onNonAi}
          className="min-h-11 rounded-lg border border-[#005B7F] bg-white px-4 py-2 text-sm font-semibold text-[#005B7F] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/50"
        >
          Use non-AI alternative
        </button>
        <button
          type="button"
          onClick={onHumanSupport}
          className="min-h-11 rounded-lg bg-[#0C1833] px-4 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/50"
        >
          Request human support info
        </button>
        <Link
          href="/ask"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-[#0C1833] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/50"
        >
          Open classic Ask MapAble
        </Link>
      </div>
    </section>
  );
}
