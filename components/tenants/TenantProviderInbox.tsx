"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { CoverageCareEnquiry } from "@/lib/coverage-care/types";
import type { ProviderInboxStatus } from "@/lib/tenancy/tenant-enquiry-model";

const NEXT_STATUSES: Record<ProviderInboxStatus, ProviderInboxStatus[]> = {
  new: ["in_review", "needs_information", "closed"],
  in_review: ["needs_information", "closed"],
  needs_information: ["in_review", "closed"],
  closed: [],
};

export function TenantProviderInbox({
  enquiries,
}: {
  enquiries: CoverageCareEnquiry[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [replies, setReplies] = useState<Record<string, string>>({});

  async function setStatus(enquiryId: string, providerStatus: ProviderInboxStatus) {
    setError(null);
    const response = await fetch(
      `/api/coverage-care/provider/inbox/${enquiryId}/review`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerStatus,
          notes: notes[enquiryId] ?? "",
          reply: replies[enquiryId] ?? "",
        }),
      },
    );
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Status update failed");
      return;
    }
    router.refresh();
  }

  if (enquiries.length === 0) {
    return (
      <p className="mt-8 text-[color:var(--cc-ink)]/75" role="status">
        No visible enquiries. Withdrawn consent removes items immediately.
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
        {enquiries.map((enquiry) => {
          const status = enquiry.providerStatus ?? "new";
          return (
            <li
              key={enquiry.id}
              className="rounded-md border border-[color:var(--cc-sage)]/30 bg-white p-4"
            >
              <p className="font-medium text-[color:var(--cc-olive)]">
                Enquiry {enquiry.id.slice(0, 14)}… — provider status:{" "}
                {status.replaceAll("_", " ")}
              </p>
              {enquiry.sharePreview ? (
                <p className="mt-2 text-sm text-[color:var(--cc-ink)]/75">
                  Channel: {enquiry.sharePreview.preferredChannel}. Shared:{" "}
                  {enquiry.sharePreview.fieldsShared.join(", ")}
                </p>
              ) : null}
              {enquiry.responderLabel ? (
                <p className="mt-1 text-sm">
                  Responding as: <strong>{enquiry.responderLabel}</strong>
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
              <label className="mt-3 block text-sm font-medium">
                Mock reply to participant
                <textarea
                  value={replies[enquiry.id] ?? enquiry.providerReply ?? ""}
                  onChange={(event) =>
                    setReplies((prev) => ({
                      ...prev,
                      [enquiry.id]: event.target.value,
                    }))
                  }
                  rows={2}
                  className="mt-1 w-full rounded-md border border-[color:var(--cc-olive)]/30 px-3 py-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
                />
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                {NEXT_STATUSES[status].map((next) => (
                  <button
                    key={next}
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(() => void setStatus(enquiry.id, next))
                    }
                    className="inline-flex min-h-11 items-center rounded-md bg-[color:var(--cc-olive)] px-4 text-white disabled:opacity-60 focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
                  >
                    Mark {next.replaceAll("_", " ")}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-sm text-[color:var(--cc-ink)]/70">
                Participant human contact: support.demo@coveragecare.example
                (synthetic).
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
