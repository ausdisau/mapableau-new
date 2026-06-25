import Link from "next/link";

import { ACCESS_LABELS } from "@/lib/access-map/copy";

export type AccessPlaceCardData = {
  id: string;
  name: string;
  category: string;
  suburb?: string | null;
  reviewCount?: number;
  confidence?: string;
  overallScore?: number | null;
  activeAlertCount?: number;
};

export function AccessPlaceCard({ place }: { place: AccessPlaceCardData }) {
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
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
        {place.overallScore != null ? (
          <span aria-label={`Overall access score ${place.overallScore} out of 5`}>
            Score: {place.overallScore.toFixed(1)}/5
          </span>
        ) : (
          <span>{ACCESS_LABELS.needsMore}</span>
        )}
        {(place.reviewCount ?? 0) > 0 ? (
          <span>{place.reviewCount} report{place.reviewCount === 1 ? "" : "s"}</span>
        ) : null}
        {(place.activeAlertCount ?? 0) > 0 ? (
          <span className="text-destructive" role="status">
            {place.activeAlertCount} active alert
            {place.activeAlertCount === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>
    </article>
  );
}
