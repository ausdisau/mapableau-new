"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function EnrolButton({ courseSlug }: { courseSlug: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onEnrol() {
    setPending(true);
    setError(null);
    const res = await fetch("/api/academy/enrolments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseSlug }),
    });
    setPending(false);
    if (res.status === 401) {
      router.push(`/login?callbackUrl=/academy/courses/${courseSlug}`);
      return;
    }
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Enrolment did not work. Please try again.");
      return;
    }
    const data = (await res.json()) as { enrolment: { id: string } };
    router.push(`/academy/learn/${data.enrolment.id}`);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onEnrol}
        disabled={pending}
        className="rounded bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:opacity-60"
      >
        {pending ? "Enrolling…" : "Enrol and start learning"}
      </button>
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
