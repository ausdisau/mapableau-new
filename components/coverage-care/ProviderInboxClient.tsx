"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { CoverageCareEnquiry } from "@/lib/coverage-care/types";

export function ProviderInboxClient({
  enquiries,
}: {
  enquiries: CoverageCareEnquiry[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function markReviewed(enquiryId: string) {
    setError(null);
    const response = await fetch(
      `/api/coverage-care/provider/inbox/${enquiryId}/review`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notes[enquiryId] ?? "" }),
      },
    );
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Review failed");
      return;
    }
    router.refresh();
  }

  if (enquiries.length === 0) {
    return (
      <p className="mt-8 text-[color:var(--cc-ink)]/75" role="status">
        No submitted enquiries in this tenant inbox.
      </p>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      {error ? (
        <p className="text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="space-y-4" aria-label="Provider enquiry inbox">
        {enquiries.map((enquiry) => (
          <li
            key={enquiry.id}
            className="rounded-md border border-[color:var(--cc-sage)]/30 bg-white p-4"
          >
            <p className="font-medium text-[color:var(--cc-olive)]">
              Enquiry {enquiry.id.slice(0, 14)}… — {enquiry.status.replaceAll("_", " ")}
            </p>
            {enquiry.sharePreview ? (
              <p className="mt-2 text-sm text-[color:var(--cc-ink)]/75">
                Shared fields: {enquiry.sharePreview.fieldsShared.join(", ")}
              </p>
            ) : null}
            <label className="mt-3 block text-sm font-medium">
              Provider notes
              <textarea
                value={notes[enquiry.id] ?? enquiry.providerNotes ?? ""}
                onChange={(event) =>
                  setNotes((prev) => ({
                    ...prev,
                    [enquiry.id]: event.target.value,
                  }))
                }
                rows={2}
                className="mt-1 w-full rounded-md border border-[color:var(--cc-olive)]/30 px-3 py-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
              />
            </label>
            <button
              type="button"
              disabled={pending || enquiry.status === "provider_reviewed"}
              onClick={() =>
                startTransition(() => void markReviewed(enquiry.id))
              }
              className="mt-3 inline-flex min-h-11 items-center rounded-md bg-[color:var(--cc-olive)] px-4 text-white disabled:opacity-60 focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
            >
              Mark reviewed
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
