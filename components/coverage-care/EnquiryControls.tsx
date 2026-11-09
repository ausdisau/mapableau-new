"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { CommunicationChannel } from "@/lib/tenancy/tenant-enquiry-model";

const CHANNELS: { value: CommunicationChannel; label: string }[] = [
  { value: "text_message", label: "Text message" },
  { value: "email", label: "Email" },
  { value: "phone_call", label: "Phone call" },
  { value: "aac_text_only", label: "AAC / text-only" },
  { value: "supporter_assisted", label: "Supporter-assisted" },
];

export function EnquiryControls({
  enquiryId,
  status,
  preferredChannel = "email",
  accessRequirements = "",
  participantNote = "",
  fieldsShared = ["firstName", "suburb"],
  providerLabel = "Coverage Care directory provider",
}: {
  enquiryId: string;
  status: string;
  preferredChannel?: CommunicationChannel;
  accessRequirements?: string;
  participantNote?: string;
  fieldsShared?: string[];
  providerLabel?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [channel, setChannel] = useState<CommunicationChannel>(preferredChannel);
  const [access, setAccess] = useState(accessRequirements);
  const [note, setNote] = useState(participantNote);
  const canAmend = status === "draft" || status === "sharing_review";

  async function withdraw() {
    setError(null);
    const response = await fetch(
      `/api/coverage-care/enquiries/${enquiryId}/withdraw`,
      { method: "POST" },
    );
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Withdraw failed");
      return;
    }
    router.refresh();
  }

  async function remove() {
    setError(null);
    const response = await fetch(
      `/api/coverage-care/enquiries/${enquiryId}`,
      { method: "DELETE" },
    );
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Delete failed");
      return;
    }
    router.push("/t/coveragecare/portal");
    router.refresh();
  }

  async function amend() {
    setError(null);
    const response = await fetch(
      `/api/coverage-care/enquiries/${enquiryId}/amend`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sharePreview: {
            fieldsShared:
              fieldsShared.length > 0 ? fieldsShared : ["firstName"],
            purpose: "Synthetic Coverage Care allied-health enquiry",
            providerLabel,
            participantNote: note.trim() || undefined,
            preferredChannel: channel,
            accessRequirements: access.trim() || undefined,
          },
        }),
      },
    );
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Amend failed");
      return;
    }
    router.refresh();
  }

  if (status === "deleted") return null;

  return (
    <div className="mt-6 space-y-6">
      {error ? (
        <p className="text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      {canAmend ? (
        <fieldset className="space-y-3 rounded-md border border-[color:var(--cc-sage)]/30 bg-white p-4">
          <legend className="px-1 text-sm font-semibold text-[color:var(--cc-olive)]">
            Amend before submit / close
          </legend>
          <div className="space-y-2">
            {CHANNELS.map((item) => (
              <label key={item.value} className="flex min-h-11 items-center gap-3">
                <input
                  type="radio"
                  name="amend-channel"
                  checked={channel === item.value}
                  onChange={() => setChannel(item.value)}
                  className="h-5 w-5"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
          <label className="block text-sm font-medium">
            Access requirements
            <textarea
              value={access}
              onChange={(event) => setAccess(event.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-[color:var(--cc-olive)]/30 px-3 py-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
            />
          </label>
          <label className="block text-sm font-medium">
            Note
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-[color:var(--cc-olive)]/30 px-3 py-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
            />
          </label>
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => void amend())}
            className="inline-flex min-h-11 items-center rounded-md bg-[color:var(--cc-olive)] px-4 text-white disabled:opacity-60 focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
          >
            Save amendments
          </button>
        </fieldset>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {status !== "withdrawn" ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => void withdraw())}
            className="inline-flex min-h-11 items-center rounded-md border border-[color:var(--cc-olive)] px-4 text-[color:var(--cc-olive)] disabled:opacity-60 focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
          >
            Withdraw enquiry and revoke sharing consent
          </button>
        ) : null}
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => void remove())}
          className="inline-flex min-h-11 items-center rounded-md bg-red-800 px-4 text-white disabled:opacity-60 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-300"
        >
          Delete enquiry record
        </button>
      </div>
      <p className="text-sm text-[color:var(--cc-ink)]/70">
        Prefer a human path? Contact support.demo@coveragecare.example
        (synthetic).
      </p>
    </div>
  );
}
