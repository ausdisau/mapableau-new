import Link from "next/link";

import { ACCESS_LABELS } from "@/lib/access-map/copy";

export type AccessPlaceCardData = {
  id: string;
  name: string;
  category: string;
  suburb?: string | null;
  reviewCount?: number;
  confidence?: string;
  /** Lightweight marker/list secondary states — not colour-only. */
  hasTemporaryAlert?: boolean;
  informationMayBeStale?: boolean;
  hasProfessionalAssessment?: boolean;
};

export function AccessPlaceCard({ place }: { place: AccessPlaceCardData }) {
  const states: string[] = [];
  if ((place.reviewCount ?? 0) > 0) {
    states.push(ACCESS_LABELS.communityInfoAvailable);
  } else {
    states.push(ACCESS_LABELS.noCommunityInfoYet);
  }
  if (place.hasTemporaryAlert) {
    states.push(ACCESS_LABELS.temporaryBarrierReported);
  }
  if (place.informationMayBeStale) {
    states.push(ACCESS_LABELS.informationMayBeStale);
  }
  if (place.hasProfessionalAssessment) {
    states.push(ACCESS_LABELS.professionalAssessmentAvailable);
  }

  return (
    <article className="rounded-lg border border-border p-4">
      <h3 className="text-lg font-semibold">
        <Link href={`/access/places/${place.id}`} className="hover:underline">
          {place.name}
        </Link>
      </h3>
      <p className="text-sm text-muted-foreground capitalize">
        {place.category.replace(/_/g, " ")}
        {place.suburb ? ` · ${place.suburb}` : ""}
      </p>
      <ul className="mt-2 space-y-1 text-sm" aria-label="Access information state">
        {states.map((label) => (
          <li key={label}>
            <span aria-hidden="true">• </span>
            {label}
          </li>
        ))}
      </ul>
    </article>
  );
}
