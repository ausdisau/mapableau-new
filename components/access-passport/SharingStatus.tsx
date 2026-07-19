"use client";

import Link from "next/link";

import { isSharingActive } from "@/lib/access-passport/share-settings";
import {
  ACCESS_SHARE_CATEGORY_LABELS,
  type AccessShareSettings,
} from "@/types/access-passport";

export function SharingStatus({
  settings,
}: {
  settings: AccessShareSettings;
}) {
  if (!isSharingActive(settings)) return null;

  const labels = settings.categories.map(
    (category) => ACCESS_SHARE_CATEGORY_LABELS[category],
  );

  return (
    <div
      className="sticky top-[var(--mapable-header-offset,0px)] z-30 border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
      role="status"
      aria-live="polite"
      data-testid="sharing-status"
    >
      <p className="font-black">You are sharing access requirements</p>
      <p className="mt-1">
        Sharing {labels.join(", ")} with {settings.recipientLabel || "selected recipients"}{" "}
        for: {settings.purpose}
        {settings.expiresAt
          ? ` · Ends ${new Date(settings.expiresAt).toLocaleDateString("en-AU")}`
          : " · No end date set"}
        .{" "}
        <Link href="/dashboard/access-passport" className="font-bold underline mapable-focus">
          Review or revoke
        </Link>
      </p>
    </div>
  );
}
