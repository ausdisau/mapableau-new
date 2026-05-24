"use client";

import { cn } from "@/app/lib/utils";
import { SponsoredLabel } from "@/components/ads/SponsoredLabel";
import { Badge } from "@/components/ui/badge";

export interface MapAccessibleResultItem {
  id: string;
  title: string;
  subtitle?: string;
  kind: "provider" | "sponsored" | "review" | "pickup_point" | "vehicle" | "trip";
  isVerified?: boolean;
  isSponsored?: boolean;
  statusText?: string;
}

type MapAccessibleResultsListProps = {
  items: MapAccessibleResultItem[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  id?: string;
  className?: string;
};

export function MapAccessibleResultsList({
  items,
  selectedId,
  onSelect,
  id = "map-accessible-results",
  className,
}: MapAccessibleResultsListProps) {
  if (items.length === 0) return null;

  return (
    <section
      id={id}
      aria-label="Map results list"
      className={cn("rounded-xl border border-border/60 bg-muted/20 p-4", className)}
    >
      <h3 className="text-sm font-semibold">Map results (list view)</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Keyboard-friendly list equivalent for map features. Select an item to focus it on the map.
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={cn(
                "w-full rounded-lg border border-border/60 bg-card p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selectedId === item.id && "border-primary/40 ring-2 ring-primary/15",
              )}
              aria-pressed={selectedId === item.id}
              onClick={() => onSelect?.(item.id)}
            >
              <div className="flex flex-wrap items-center gap-2">
                {item.isSponsored ? <SponsoredLabel compact /> : null}
                {item.isVerified ? (
                  <Badge variant="outline" className="text-xs">
                    Verified
                  </Badge>
                ) : null}
                <span className="font-medium text-sm">{item.title}</span>
              </div>
              {item.subtitle ? (
                <p className="mt-1 text-xs text-muted-foreground">{item.subtitle}</p>
              ) : null}
              {item.statusText ? (
                <p className="mt-1 text-xs text-foreground">{item.statusText}</p>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
