"use client";

import Link from "next/link";

export function AccessReportDraftResume({
  placeId,
  draftId,
  placeName,
}: {
  placeId: string;
  draftId: string;
  placeName: string;
}) {
  return (
    <div
      className="rounded-lg border border-border bg-muted/30 p-4"
      role="status"
    >
      <p className="font-medium">Continue your draft report</p>
      <p className="mt-1 text-sm text-muted-foreground">
        You have an unfinished access report for {placeName}.
      </p>
      <Link
        href={`/access/places/${placeId}/report/${draftId}/edit`}
        className="mt-2 inline-block text-sm underline"
      >
        Resume draft
      </Link>
    </div>
  );
}
