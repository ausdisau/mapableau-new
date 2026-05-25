"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function VerificationReviewActions({ recordId }: { recordId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState("");

  async function review(nextStatus: "verified" | "rejected") {
    setStatus("Saving...");
    const res = await fetch(`/api/verification/records/${recordId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    setStatus(res.ok ? "Updated." : "Could not update.");
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className="min-h-11 rounded-md bg-blue-700 px-3 text-sm font-medium text-white"
        onClick={() => review("verified")}
      >
        Verify
      </button>
      <button
        type="button"
        className="min-h-11 rounded-md border border-slate-300 px-3 text-sm font-medium"
        onClick={() => review("rejected")}
      >
        Reject
      </button>
      <span aria-live="polite" className="text-sm text-slate-600">
        {status}
      </span>
    </div>
  );
}
