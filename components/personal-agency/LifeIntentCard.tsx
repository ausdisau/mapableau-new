"use client";

import type { LifeIntentStatus } from "@prisma/client";
import Link from "next/link";

const STATUS_LABELS: Record<LifeIntentStatus, string> = {
  EXPLORING: "Exploring",
  PLANNING: "Planning",
  ACTIVE: "Active",
  PAUSED: "Paused",
  COMPLETED: "Completed",
};

export function LifeIntentCard({
  id,
  title,
  originalExpression,
  status,
}: {
  id: string;
  title?: string;
  originalExpression: string;
  status: LifeIntentStatus;
}) {
  const displayTitle =
    title ??
    originalExpression.split(/[.!?]/)[0]?.slice(0, 60) ??
    "Life intent";

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-bold text-[#0C1833]">{displayTitle}</h3>
      <p className="mt-2 text-sm italic text-slate-600">
        &ldquo;{originalExpression}&rdquo;
      </p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[#005B7F]">
        Status: {STATUS_LABELS[status]}
      </p>
      <Link
        href={`/my/life/${id}`}
        className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-[#005B7F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#004A66] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
      >
        Continue
      </Link>
    </article>
  );
}
