"use client";

import Link from "next/link";
import React, { useState } from "react";

import { SuburbGuideSection } from "@/components/guides/suburb/SuburbGuideSection";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import {
  mapablePublicPrimaryButtonClass,
} from "@/lib/marketing/public-page-styles";
import type { SuburbAccessGuide } from "@/types/suburb-access-guide";

type SuburbGuideReportFormProps = {
  guide: SuburbAccessGuide;
};

export function SuburbGuideReportForm({ guide }: SuburbGuideReportFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [updateType, setUpdateType] = useState("other");
  const [details, setDetails] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [feedback, setFeedback] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setFeedback("");
    try {
      const response = await fetch("/api/guides/suburbs/report-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: guide.stateSlug,
          slug: guide.slug,
          name,
          email,
          updateType,
          details,
          company,
        }),
      });
      const payload = (await response.json()) as {
        message?: string;
        error?: string;
      };
      if (!response.ok) {
        setStatus("error");
        setFeedback(payload.error ?? "Could not send your update.");
        return;
      }
      setStatus("success");
      setFeedback(payload.message ?? "Thanks — your update was received.");
      setDetails("");
    } catch {
      setStatus("error");
      setFeedback("Could not send your update. Please try again later.");
    }
  }

  return (
    <SuburbGuideSection id="report-form" title="Send an update">
      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        <div className="sr-only" aria-hidden="true">
          <label htmlFor="company">Company</label>
          <input
            id="company"
            name="company"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div>
          <label
            htmlFor="report-name"
            className="text-sm font-black text-[#0C1833]"
          >
            Your name
          </label>
          <input
            id="report-name"
            name="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={`mt-2 w-full min-h-11 rounded-2xl border border-slate-200 px-4 text-sm ${mapableCareFocusRing}`}
          />
        </div>

        <div>
          <label
            htmlFor="report-email"
            className="text-sm font-black text-[#0C1833]"
          >
            Email
          </label>
          <input
            id="report-email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={`mt-2 w-full min-h-11 rounded-2xl border border-slate-200 px-4 text-sm ${mapableCareFocusRing}`}
          />
        </div>

        <div>
          <label
            htmlFor="report-type"
            className="text-sm font-black text-[#0C1833]"
          >
            What changed?
          </label>
          <select
            id="report-type"
            name="updateType"
            value={updateType}
            onChange={(event) => setUpdateType(event.target.value)}
            className={`mt-2 w-full min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm ${mapableCareFocusRing}`}
          >
            <option value="toilet">Toilet / Changing Places</option>
            <option value="transport">Transport</option>
            <option value="parking">Parking / drop-off</option>
            <option value="quiet-space">Quiet space / sensory</option>
            <option value="hazard">Hazard / risk</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="report-details"
            className="text-sm font-black text-[#0C1833]"
          >
            Details
          </label>
          <textarea
            id="report-details"
            name="details"
            required
            rows={6}
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            className={`mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm ${mapableCareFocusRing}`}
            placeholder="What did you observe, and when?"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={status === "loading"}
            className={`${mapablePublicPrimaryButtonClass} ${mapableCareFocusRing} disabled:opacity-60`}
          >
            {status === "loading" ? "Sending…" : "Submit update"}
          </button>
          <Link
            href={guide.href}
            className={`inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-[#005B7F] ${mapableCareFocusRing}`}
          >
            Back to suburb guide
          </Link>
        </div>

        <p
          className="text-sm leading-7 text-slate-700"
          role="status"
          aria-live="polite"
        >
          {feedback}
        </p>
      </form>
    </SuburbGuideSection>
  );
}
