"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/button";

/**
 * ATAG-oriented floor-plan draft form. Alt text is required before submit —
 * mirrors server-side `altText` enforcement in floor-plan authoring.
 */
export function FloorPlanAuthoringForm({ placeId }: { placeId: string }) {
  const formId = useId();
  const [altText, setAltText] = useState("");
  const [label, setLabel] = useState("");
  const [preview, setPreview] = useState(false);
  const [errorSummary, setErrorSummary] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  function validate(): string[] {
    const errors: string[] = [];
    if (!label.trim()) errors.push("Floor label is required.");
    if (!altText.trim()) {
      errors.push(
        "Alt text is required. Describe the floor plan for people who cannot see the image.",
      );
    } else if (altText.trim().length < 12) {
      errors.push("Alt text should be at least 12 characters.");
    }
    return errors;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validate();
    setErrorSummary(errors);
    if (errors.length) {
      document.getElementById(`${formId}-errors`)?.focus();
      return;
    }
    if (!preview) {
      setPreview(true);
      setStatus("Review the draft below, then confirm publish.");
      return;
    }
    setStatus("Submitting draft…");
    try {
      const res = await fetch(`/api/indoor/authoring/${placeId}/floor-plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim(),
          altText: altText.trim(),
          status: "draft",
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      setStatus("Draft saved. Submit for review when ready.");
      setPreview(false);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6"
      noValidate
    >
      <h2 className="text-lg font-black text-[#0C1833]">Create floor plan draft</h2>
      <p className="text-sm text-slate-600" id={`${formId}-help`}>
        Accessible by default: every plan asset needs alt text before it can be
        reviewed or published. Use plain language that names the venue, floor,
        and key accessible routes.
      </p>

      {errorSummary.length > 0 ? (
        <div
          id={`${formId}-errors`}
          role="alert"
          tabIndex={-1}
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          <p className="font-bold">Fix the following:</p>
          <ul className="mt-2 list-disc pl-5">
            {errorSummary.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-1">
        <label htmlFor={`${formId}-label`} className="text-sm font-bold">
          Floor label
        </label>
        <input
          id={`${formId}-label`}
          className="min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          aria-describedby={`${formId}-help`}
          required
        />
      </div>

      <div className="space-y-1">
        <label htmlFor={`${formId}-alt`} className="text-sm font-bold">
          Plan image alt text
        </label>
        <textarea
          id={`${formId}-alt`}
          className="min-h-[6rem] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm leading-[1.5]"
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          aria-describedby={`${formId}-alt-hint`}
          required
        />
        <p id={`${formId}-alt-hint`} className="text-xs text-slate-600">
          Example: “Ground floor of Parramatta Library showing accessible entrance
          from Civic Place, lifts to level 1, and accessible toilets near the
          service desk.”
        </p>
      </div>

      {preview ? (
        <div className="rounded-xl border border-[#005B7F]/30 bg-[#F6FBFC] p-4 text-sm">
          <h3 className="font-bold">Review before commit</h3>
          <p className="mt-2">
            <strong>Label:</strong> {label}
          </p>
          <p className="mt-1">
            <strong>Alt text:</strong> {altText}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" className="min-h-11">
          {preview ? "Confirm save draft" : "Preview draft"}
        </Button>
        {preview ? (
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={() => setPreview(false)}
          >
            Edit again
          </Button>
        ) : null}
      </div>

      {status ? (
        <p role="status" aria-live="polite" className="text-sm text-slate-600">
          {status}
        </p>
      ) : null}
    </form>
  );
}
