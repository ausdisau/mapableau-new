"use client";

import React, { useMemo, useState } from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import {
  mapablePublicCardClass,
  mapablePublicPrimaryButtonClass,
  mapablePublicSecondaryButtonClass,
} from "@/lib/marketing/public-page-styles";
import { BUSINESS_RESOURCES_DISCLAIMER } from "@/lib/resources/business-resources-data";

export function BusinessAccessStatementGenerator() {
  const [businessName, setBusinessName] = useState("");
  const [location, setLocation] = useState("");
  const [knownFeatures, setKnownFeatures] = useState("");
  const [limitations, setLimitations] = useState("");
  const [contact, setContact] = useState("");
  const [lastReviewed, setLastReviewed] = useState("");
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);

  const statement = useMemo(() => {
    const name = businessName.trim() || "[Business name]";
    const place = location.trim() || "[location]";
    const features =
      knownFeatures.trim() ||
      "[Describe known features such as entrance notes, toilets, parking or quieter times]";
    const limits =
      limitations.trim() ||
      "[Describe limitations honestly — for example steps, busy peak times or unverified details]";
    const who =
      contact.trim() ||
      "[Name or email for access questions and updates]";
    const reviewed = lastReviewed.trim() || "[date]";

    return [
      `Accessibility statement for ${name}`,
      "",
      `${name} at ${place} provides practical access information to help customers, visitors and workers plan ahead.`,
      "",
      "What we currently know:",
      features,
      "",
      "Known limitations and things to check:",
      limits,
      "",
      "How to request assistance or updates:",
      `Contact ${who}. We welcome access feedback and aim to acknowledge updates promptly.`,
      "",
      "Important note:",
      BUSINESS_RESOURCES_DISCLAIMER,
      "",
      `Last reviewed: ${reviewed}`,
      "",
      "This statement is practical access guidance. It is not a legal compliance certificate and does not mean MapAble Accreditation has been awarded.",
    ].join("\n");
  }, [
    businessName,
    location,
    knownFeatures,
    limitations,
    contact,
    lastReviewed,
  ]);

  async function copyStatement() {
    try {
      await navigator.clipboard.writeText(statement);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        className={`${mapablePublicCardClass} space-y-5`}
        onSubmit={(event) => {
          event.preventDefault();
          setGenerated(true);
        }}
      >
        <div>
          <h2 className="text-lg font-black text-[#0C1833]">
            Statement details
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-700">
            Fill in what you know. Leave gaps rather than guessing. The draft
            below updates when you generate it.
          </p>
        </div>

        <div>
          <label
            htmlFor="statement-business-name"
            className="text-sm font-black text-[#0C1833]"
          >
            Business or venue name
          </label>
          <input
            id="statement-business-name"
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
            className={`mt-2 w-full min-h-11 rounded-2xl border border-slate-200 px-4 text-sm ${mapableCareFocusRing}`}
          />
        </div>

        <div>
          <label
            htmlFor="statement-location"
            className="text-sm font-black text-[#0C1833]"
          >
            Location
          </label>
          <input
            id="statement-location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className={`mt-2 w-full min-h-11 rounded-2xl border border-slate-200 px-4 text-sm ${mapableCareFocusRing}`}
          />
        </div>

        <div>
          <label
            htmlFor="statement-features"
            className="text-sm font-black text-[#0C1833]"
          >
            Known access features
          </label>
          <textarea
            id="statement-features"
            rows={4}
            value={knownFeatures}
            onChange={(event) => setKnownFeatures(event.target.value)}
            className={`mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm ${mapableCareFocusRing}`}
            placeholder="Example: Step-free side entrance from the car park; staff can assist with the front door."
          />
        </div>

        <div>
          <label
            htmlFor="statement-limits"
            className="text-sm font-black text-[#0C1833]"
          >
            Known limitations
          </label>
          <textarea
            id="statement-limits"
            rows={4}
            value={limitations}
            onChange={(event) => setLimitations(event.target.value)}
            className={`mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm ${mapableCareFocusRing}`}
            placeholder="Example: Main entrance has a small step; accessible toilet hours still being verified."
          />
        </div>

        <div>
          <label
            htmlFor="statement-contact"
            className="text-sm font-black text-[#0C1833]"
          >
            Contact for access questions
          </label>
          <input
            id="statement-contact"
            value={contact}
            onChange={(event) => setContact(event.target.value)}
            className={`mt-2 w-full min-h-11 rounded-2xl border border-slate-200 px-4 text-sm ${mapableCareFocusRing}`}
          />
        </div>

        <div>
          <label
            htmlFor="statement-reviewed"
            className="text-sm font-black text-[#0C1833]"
          >
            Last reviewed date
          </label>
          <input
            id="statement-reviewed"
            value={lastReviewed}
            onChange={(event) => setLastReviewed(event.target.value)}
            className={`mt-2 w-full min-h-11 rounded-2xl border border-slate-200 px-4 text-sm ${mapableCareFocusRing}`}
            placeholder="YYYY-MM-DD"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className={`${mapablePublicPrimaryButtonClass} ${mapableCareFocusRing}`}
          >
            Generate draft statement
          </button>
          <button
            type="button"
            className={`${mapablePublicSecondaryButtonClass} ${mapableCareFocusRing}`}
            onClick={() => {
              setBusinessName("");
              setLocation("");
              setKnownFeatures("");
              setLimitations("");
              setContact("");
              setLastReviewed("");
              setGenerated(false);
            }}
          >
            Clear form
          </button>
        </div>
      </form>

      <section
        aria-labelledby="statement-output-heading"
        className={mapablePublicCardClass}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2
            id="statement-output-heading"
            className="text-lg font-black text-[#0C1833]"
          >
            Draft accessibility statement
          </h2>
          <button
            type="button"
            onClick={copyStatement}
            className={`inline-flex min-h-11 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#005B7F] ${mapableCareFocusRing}`}
          >
            {copied ? "Copied" : "Copy text"}
          </button>
        </div>
        <p className="mt-2 text-sm leading-7 text-slate-700">
          {generated
            ? "Review and edit before publishing. Keep claims carefully limited to what you can verify."
            : "Generate a draft to preview your statement here. A starter template is always available below."}
        </p>
        <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-800">
          {statement}
        </pre>
      </section>
    </div>
  );
}
