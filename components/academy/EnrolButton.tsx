"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function EnrolButton({
  courseId,
  enrolled,
}: {
  courseId: string;
  enrolled: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [extendedTime, setExtendedTime] = useState(false);

  if (enrolled) {
    return (
      <a
        href={`/academy/courses/${courseId}/learn`}
        className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 font-medium text-primary-foreground"
      >
        Continue learning
      </a>
    );
  }

  async function enrol() {
    setLoading(true);
    const res = await fetch("/api/academy/enrolments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, extendedTime }),
    });
    setLoading(false);
    if (res.ok) {
      router.push(`/academy/courses/${courseId}/learn`);
      router.refresh();
    }
  }

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={extendedTime}
          onChange={(e) => setExtendedTime(e.target.checked)}
        />
        I need extended time for quizzes (accessibility accommodation)
      </label>
      <button
        type="button"
        onClick={enrol}
        disabled={loading}
        className="min-h-11 rounded-lg bg-primary px-4 font-medium text-primary-foreground disabled:opacity-50"
      >
        {loading ? "Enrolling…" : "Enrol for free"}
      </button>
    </div>
  );
}
