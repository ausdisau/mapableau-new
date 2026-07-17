import React from "react";

import { formatSuburbGuideStatus } from "@/lib/resources/suburb-access-guides-data";
import type { SuburbGuideStatus } from "@/types/suburb-access-guide";

type SuburbGuideStatusBadgeProps = {
  status: SuburbGuideStatus;
};

export function SuburbGuideStatusBadge({ status }: SuburbGuideStatusBadgeProps) {
  const tone =
    status === "mapable-verified" || status === "mapable-reviewed"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : status === "needs-local-verification" || status === "not-started"
        ? "border-amber-200 bg-amber-50 text-amber-950"
        : "border-slate-200 bg-slate-50 text-slate-800";

  return (
    <span
      className={`inline-flex min-h-11 items-center rounded-full border px-3 text-xs font-bold ${tone}`}
    >
      {formatSuburbGuideStatus(status)}
    </span>
  );
}
