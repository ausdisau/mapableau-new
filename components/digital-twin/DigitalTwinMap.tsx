"use client";

import type { TwinPlace } from "@/lib/digital-twin/types";

type Props = {
  places: TwinPlace[];
  selectedPlaceId?: string;
  onSelectPlace?: (placeId: string) => void;
  showPathSegments?: boolean;
};

/**
 * Map integration placeholder.
 * Renders an accessible list fallback — no heavy map dependency required for MVP.
 * TODO: Integrate MapLibre layer when map style URL is configured.
 */
export function DigitalTwinMap({
  places,
  selectedPlaceId,
  onSelectPlace,
}: Props) {
  return (
    <section aria-label="Digital Twin places map and list" className="rounded-xl border border-border">
      <div className="border-b border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        Text list view — map preview available when map integration is configured.
      </div>
      <ul className="divide-y divide-border" role="list">
        {places.map((place) => {
          const selected = place.id === selectedPlaceId;
          return (
            <li key={place.id}>
              <button
                type="button"
                onClick={() => onSelectPlace?.(place.id)}
                aria-pressed={selected}
                aria-label={`${place.name}, ${place.region}, score ${place.overallAccessibilityScore}`}
                className={`flex w-full min-h-11 flex-col items-start px-4 py-3 text-left text-sm hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#F8C51C] ${
                  selected ? "bg-muted/50" : ""
                }`}
              >
                <span className="font-semibold">{place.name}</span>
                <span className="text-muted-foreground">
                  {place.address} · Score {place.overallAccessibilityScore}/100
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
