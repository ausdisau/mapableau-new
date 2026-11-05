"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function EnquiryControls({
  enquiryId,
  status,
}: {
  enquiryId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
    router.push("/coverage-care/enquiries");
    router.refresh();
  }

  if (status === "deleted") return null;

  return (
    <div className="mt-6 space-y-3">
      {error ? (
        <p className="text-sm text-red-800" role="alert">
          {error}
        </p>
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
    </div>
  );
}
