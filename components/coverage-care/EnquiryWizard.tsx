"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Step = "details" | "sharing" | "done";

export function EnquiryWizard({
  listingId,
  listingTitle,
}: {
  listingId?: string;
  listingTitle?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>("details");
  const [enquiryId, setEnquiryId] = useState<string | null>(null);
  const [note, setNote] = useState("");
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
        You stay in control. Review what will be shared before anything is sent
        to the provider inbox. Consent is independently revocable.
      </p>

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
          <label className="block text-sm font-medium">
            Optional note for the provider (synthetic)
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={4}
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
              ["firstName", "Preferred first name"],
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
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => void saveSharingAndSubmit())}
            className="mt-4 inline-flex min-h-11 items-center rounded-md bg-[color:var(--cc-olive)] px-5 text-white disabled:opacity-60 focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
          >
            Submit synthetic enquiry
          </button>
        </fieldset>
      ) : null}

      {step === "done" && enquiryId ? (
        <div className="mt-8 space-y-4" role="status">
          <p className="text-lg font-medium text-[color:var(--cc-olive)]">
            Enquiry submitted to the provider inbox (synthetic).
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/coverage-care/enquiries/${enquiryId}`}
              className="inline-flex min-h-11 items-center rounded-md border border-[color:var(--cc-olive)] px-4 text-[color:var(--cc-olive)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
            >
              Review or withdraw
            </Link>
            <button
              type="button"
              onClick={() => router.push("/coverage-care/enquiries")}
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
