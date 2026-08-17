import Link from "next/link";

import { ScoreLabel, TierBadge } from "@/components/digital-twin/TierBadge";
import type { TwinAssessmentTier } from "@/lib/digital-twin/types";

export type DigitalTwinPlaceCardData = {
  id: string;
  slug: string;
  name: string;
  placeType: string;
  region: string;
  overallAccessibilityScore: number;
  confidenceScore: number;
  lastVerifiedAt: string;
  tier: TwinAssessmentTier;
  topStrengths?: string[];
  topBarriers?: string[];
};

export function DigitalTwinPlaceCard({ place }: { place: DigitalTwinPlaceCardData }) {
  return (
    <article
      className="flex h-full flex-col rounded-xl border border-border bg-card p-5 shadow-sm"
      aria-labelledby={`place-card-${place.id}`}
    >
      <h2 id={`place-card-${place.id}`} className="text-lg font-semibold">
        <Link
          href={`/digital-twin/${place.slug}`}
          className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C]"
        >
          {place.name}
        </Link>
      </h2>
      <p className="mt-1 text-sm capitalize text-muted-foreground">
        {place.placeType.replace(/_/g, " ")} · {place.region}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <TierBadge tier={place.tier} />
        <ScoreLabel score={place.overallAccessibilityScore} confidence={place.confidenceScore} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Last verified:{" "}
        {new Date(place.lastVerifiedAt).toLocaleDateString("en-AU", {
          dateStyle: "medium",
        })}
      </p>
      {place.topStrengths && place.topStrengths.length > 0 && (
        <p className="mt-3 text-sm">
          <span className="font-medium">Strengths: </span>
          {place.topStrengths.join(", ")}
        </p>
      )}
      {place.topBarriers && place.topBarriers.length > 0 && (
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="font-medium">Barriers: </span>
          {place.topBarriers.join("; ")}
        </p>
      )}
      <Link
        href={`/digital-twin/${place.slug}`}
        className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-[#005B7F] hover:underline"
      >
        View access details
      </Link>
    </article>
  );
}
