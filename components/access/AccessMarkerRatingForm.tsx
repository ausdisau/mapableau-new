"use client";

import { useState } from "react";

import { AccessMarkerModal } from "@/components/access/AccessMarkerModal";
import { AccessibleFormField, formInputClass } from "@/components/forms/AccessibleFormField";
import {
  DOMAIN_FIELD_LABELS,
  RATING_SCALE_LABELS,
  type AccessMarkerDomainKey,
} from "@/lib/access-markers/types";

const DOMAINS: AccessMarkerDomainKey[] = [
  "overall",
  "mobility",
  "toilet",
  "parkingDropoff",
  "sensory",
  "communication",
  "staffService",
];

const FIELD_KEYS: Record<AccessMarkerDomainKey, string> = {
  overall: "overallRating",
  mobility: "mobilityRating",
  toilet: "toiletRating",
  parkingDropoff: "parkingDropoffRating",
  sensory: "sensoryRating",
  communication: "communicationRating",
  staffService: "staffServiceRating",
};

type AccessMarkerRatingFormProps = {
  placeId: string;
  placeName: string;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function AccessMarkerRatingForm({
  placeId,
  placeName,
  open,
  onClose,
  onSaved,
}: AccessMarkerRatingFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);

    const body: Record<string, unknown> = {
      visitedInPerson: fd.get("visitedInPerson") === "on",
      visitedAt: fd.get("visitedAt")
        ? new Date(String(fd.get("visitedAt"))).toISOString()
        : null,
      usedMobilityAid:
        fd.get("usedMobilityAid") === "yes"
          ? true
          : fd.get("usedMobilityAid") === "no"
            ? false
            : null,
      mobilityAidType: fd.get("mobilityAidType") || null,
    };

    for (const domain of DOMAINS) {
      body[FIELD_KEYS[domain]] = Number(fd.get(FIELD_KEYS[domain]) ?? 0);
    }

    try {
      const res = await fetch(`/api/access/places/${placeId}/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Could not save rating. Sign in and try again.");
        return;
      }
      onSaved();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AccessMarkerModal
      open={open}
      title={`Rate access — ${placeName}`}
      onClose={onClose}
    >
      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        <p className="text-sm text-muted-foreground">
          Describe observed access conditions. Use 0 for “I don’t know”. This is
          community information — not a legal or DDA determination.
        </p>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {DOMAINS.map((domain) => {
          const field = FIELD_KEYS[domain];
          return (
            <fieldset key={domain} className="rounded-xl border border-border p-3">
              <legend className="px-1 text-sm font-medium">
                {DOMAIN_FIELD_LABELS[domain]}
              </legend>
              <div className="mt-2 grid gap-2">
                {[0, 1, 2, 3, 4, 5].map((value) => (
                  <label
                    key={value}
                    className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-muted/60"
                  >
                    <input
                      type="radio"
                      name={field}
                      value={value}
                      defaultChecked={value === 0}
                      className="h-5 w-5"
                      required={domain === "overall"}
                    />
                    <span className="text-sm">
                      <span className="font-semibold">{value}</span>
                      {" — "}
                      {RATING_SCALE_LABELS[value]}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          );
        })}

        <label className="flex min-h-12 items-center gap-3">
          <input type="checkbox" name="visitedInPerson" defaultChecked className="h-5 w-5" />
          <span className="text-sm">I visited this place in person</span>
        </label>

        <AccessibleFormField id="visitedAt" label="Date visited (optional)">
          <input
            id="visitedAt"
            name="visitedAt"
            type="date"
            className={formInputClass}
          />
        </AccessibleFormField>

        <AccessibleFormField
          id="usedMobilityAid"
          label="Did you use a mobility aid? (optional)"
        >
          <select id="usedMobilityAid" name="usedMobilityAid" className={formInputClass}>
            <option value="">Prefer not to say</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </AccessibleFormField>

        <AccessibleFormField
          id="mobilityAidType"
          label="Mobility aid type (optional)"
          hint="Only if relevant to your rating."
        >
          <select id="mobilityAidType" name="mobilityAidType" className={formInputClass}>
            <option value="">Not specified</option>
            <option value="manual_wheelchair">Manual wheelchair</option>
            <option value="powerchair">Powerchair</option>
            <option value="mobility_scooter">Mobility scooter</option>
            <option value="walker">Walker</option>
            <option value="cane">Cane</option>
            <option value="other">Other</option>
          </select>
        </AccessibleFormField>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="min-h-12 rounded-xl bg-[#005B7F] px-5 font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Save rating"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 rounded-xl border border-border px-5 font-semibold"
          >
            Cancel
          </button>
        </div>
      </form>
    </AccessMarkerModal>
  );
}
