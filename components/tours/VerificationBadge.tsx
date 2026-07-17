import React from "react";

import {
  formatVerificationStatus,
  type TourVerification,
} from "@/lib/resources/tours-data";

type VerificationBadgeProps = {
  verification: TourVerification;
};

export function VerificationBadge({ verification }: VerificationBadgeProps) {
  return (
    <div
      className="rounded-2xl border border-amber-200 bg-amber-50 p-4"
      role="status"
    >
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-900">
        Verification status
      </p>
      <p className="mt-2 text-base font-black text-amber-950">
        {formatVerificationStatus(verification.status)}
      </p>
      <p className="mt-2 text-sm leading-7 text-amber-950">
        Last checked: {verification.lastChecked} · {verification.checkedByLabel}
      </p>
      <p className="mt-2 text-sm leading-7 text-amber-950">
        {verification.notes}
      </p>
      <p className="mt-3 text-sm font-semibold leading-7 text-amber-950">
        Access details are advisory and can change. Always re-check before you
        travel.
      </p>
    </div>
  );
}
