import Link from "next/link";

import { ACCESS_LABELS } from "@/lib/access-map/copy";

export type AccessPlaceCardData = {
  id: string;
  name: string;
  category: string;
  suburb?: string | null;
  reviewCount?: number;
  confidence?: string;
};

export function AccessPlaceCard({ place }: { place: AccessPlaceCardData }) {
  return (
    <article className="rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mapable-display text-xl font-black tracking-[-0.04em]">
        <Link
          href={`/access/places/${place.id}`}
          className="rounded-lg hover:text-primary focus:outline-none focus:ring-4 focus:ring-ring/40"
        >
          {place.name}
        </Link>
      </h3>
      <p className="mt-1 text-sm font-semibold text-muted-foreground capitalize">
        {place.category.replace(/_/g, " ")}
        {place.suburb ? ` · ${place.suburb}` : ""}
      </p>
      <p className="mt-3 rounded-2xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
        {(place.reviewCount ?? 0) > 0
          ? ACCESS_LABELS.communityReviewed
          : ACCESS_LABELS.needsMore}
      </p>
    </article>
  );
}
