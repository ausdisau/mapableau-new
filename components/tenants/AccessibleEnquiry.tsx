"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { CommunicationChannel } from "@/lib/tenancy/tenant-enquiry-model";

const CHANNELS: { value: CommunicationChannel; label: string }[] = [
  { value: "text_message", label: "Text message" },
  { value: "email", label: "Email" },
  { value: "phone_call", label: "Phone call (optional — never required)" },
  { value: "aac_text_only", label: "AAC / text-only" },
  { value: "supporter_assisted", label: "Supporter-assisted (scoped delegate)" },
];

type Step = "details" | "sharing" | "done";

export function AccessibleEnquiry({
  slug,
  listingId,
  listingTitle,
}: {
  slug: string;
  listingId?: string;
  listingTitle?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>("details");
  const [enquiryId, setEnquiryId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [accessRequirements, setAccessRequirements] = useState("");
  const [preferredChannel, setPreferredChannel] =
    useState<CommunicationChannel>("email");
  const [error, setError] = useState<string | null>(null);
  const [fieldsShared, setFieldsShared] = useState({
    firstName: true,
    suburb: true,
    supportGoal: true,
    phone: false,
  });

  async function createDraft() {
    setError(null);
    const response = await fetch("/api/coverage-care/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: listingId ?? null }),
    });
    const data = (await response.json()) as {
      enquiry?: { id: string };
      error?: string;
    };
    if (!response.ok || !data.enquiry) {
      setError(data.error ?? "Could not create enquiry");
      return;
    }
    setEnquiryId(data.enquiry.id);
    setStep("sharing");
  }

  async function saveSharingAndSubmit() {
    if (!enquiryId) return;
    setError(null);
    const shared = Object.entries(fieldsShared)
      .filter(([, on]) => on)
      .map(([key]) => key);

    const shareResponse = await fetch(
      `/api/coverage-care/enquiries/${enquiryId}/share`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldsShared: shared,
          purpose: "Synthetic Coverage Care allied-health enquiry",
          providerLabel: listingTitle ?? "Coverage Care directory provider",
          participantNote: note.trim() || undefined,
          preferredChannel,
          accessRequirements: accessRequirements.trim() || undefined,
        }),
      },
    );
    if (!shareResponse.ok) {
      const data = (await shareResponse.json()) as { error?: string };
      setError(data.error ?? "Could not save sharing preferences");
      return;
    }

    const submitResponse = await fetch(
      `/api/coverage-care/enquiries/${enquiryId}/submit`,
      { method: "POST" },
    );
    if (!submitResponse.ok) {
      const data = (await submitResponse.json()) as { error?: string };
      setError(data.error ?? "Could not submit enquiry");
      return;
    }
    setStep("done");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold text-[color:var(--cc-olive)]">
        Create a synthetic enquiry
      </h1>
      <p className="mt-3 text-base text-[color:var(--cc-ink)]/80">
        You stay in control. Name is optional for this demo. Diagnosis
        disclosure is never mandatory. Prefer a human?{" "}
        <Link href={`/t/${slug}/contact`} className="underline underline-offset-4">
          Contact options
        </Link>
        .
      </p>
      <aside className="mt-4 rounded-md border border-[color:var(--cc-sage)]/40 bg-white px-4 py-3 text-sm">
        <p className="font-medium text-[color:var(--cc-olive)]">
          Participant agency vs delegate
        </p>
        <p className="mt-1 text-[color:var(--cc-ink)]/75">
          A supporter may assist only with a scoped, expiring, revocable
          delegate grant — never implied family authority. This preview uses a
          synthetic delegate fixture for testing only.
        </p>
      </aside>

      {listingTitle ? (
        <p className="mt-4 rounded-md bg-[color:var(--cc-sage)]/15 px-4 py-3 text-sm">
          Selected service: <strong>{listingTitle}</strong>
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      {step === "details" ? (
        <div className="mt-8 space-y-4">
          <fieldset>
            <legend className="text-sm font-medium">
              Preferred communication method
            </legend>
            <div className="mt-2 space-y-2">
              {CHANNELS.map((channel) => (
                <label key={channel.value} className="flex min-h-11 items-center gap-3">
                  <input
                    type="radio"
                    name="channel"
                    checked={preferredChannel === channel.value}
                    onChange={() => setPreferredChannel(channel.value)}
                    className="h-5 w-5"
                  />
                  <span>{channel.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block text-sm font-medium">
            Optional functional access requirements
            <textarea
              value={accessRequirements}
              onChange={(event) => setAccessRequirements(event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-[color:var(--cc-olive)]/30 px-3 py-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
            />
          </label>
          <label className="block text-sm font-medium">
            Optional note for the provider (synthetic)
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-[color:var(--cc-olive)]/30 px-3 py-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
            />
          </label>
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => void createDraft())}
            className="inline-flex min-h-11 items-center rounded-md bg-[color:var(--cc-olive)] px-5 text-white disabled:opacity-60 focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
          >
            Continue to sharing review
          </button>
        </div>
      ) : null}

      {step === "sharing" ? (
        <fieldset className="mt-8 space-y-3">
          <legend className="text-lg font-semibold text-[color:var(--cc-olive)]">
            Review what you will share
          </legend>
          {(
            [
              ["firstName", "Preferred first name (optional)"],
              ["suburb", "Suburb / region"],
              ["supportGoal", "Support goal summary"],
              ["phone", "Phone number"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex min-h-11 items-center gap-3">
              <input
                type="checkbox"
                checked={fieldsShared[key]}
                onChange={(event) =>
                  setFieldsShared((prev) => ({
                    ...prev,
                    [key]: event.target.checked,
                  }))
                }
                className="h-5 w-5"
              />
              <span>{label}</span>
            </label>
          ))}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => setStep("details")}
              className="inline-flex min-h-11 items-center rounded-md border border-[color:var(--cc-olive)] px-4 text-[color:var(--cc-olive)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
            >
              Back / amend details
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(() => void saveSharingAndSubmit())}
              className="inline-flex min-h-11 items-center rounded-md bg-[color:var(--cc-olive)] px-5 text-white disabled:opacity-60 focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
            >
              Submit synthetic enquiry
            </button>
          </div>
        </fieldset>
      ) : null}

      {step === "done" && enquiryId ? (
        <div className="mt-8 space-y-4" role="status">
          <p className="text-lg font-medium text-[color:var(--cc-olive)]">
            Enquiry submitted to the provider inbox (synthetic).
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/t/${slug}/portal/${enquiryId}`}
              className="inline-flex min-h-11 items-center rounded-md border border-[color:var(--cc-olive)] px-4 text-[color:var(--cc-olive)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
            >
              Review, amend or withdraw
            </Link>
            <button
              type="button"
              onClick={() => router.push(`/t/${slug}/portal`)}
              className="inline-flex min-h-11 items-center rounded-md bg-[color:var(--cc-sage)] px-4 text-[color:var(--cc-ink)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-olive)]"
            >
              My enquiries
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
