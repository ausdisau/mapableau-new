"use client";

import { cn } from "@/app/lib/utils";

type MapLegendProps = {
  className?: string;
  items?: Array<{ label: string; color: string; description?: string }>;
};

const DEFAULT_ITEMS = [
  { label: "Provider", color: "#2563eb", description: "Verified and organic results" },
  { label: "Sponsored", color: "#b45309", description: "Paid placement, clearly labelled" },
  { label: "Your location", color: "#16a34a", description: "Approximate area only" },
  { label: "Pickup point", color: "#7c3aed", description: "Accessible pickup candidate" },
];

export function MapLegend({ className, items = DEFAULT_ITEMS }: MapLegendProps) {
  return (
    <aside
      className={cn(
        "rounded-lg border border-border/60 bg-card/95 p-3 text-xs shadow-sm backdrop-blur",
        className,
      )}
      aria-label="Map legend"
    >
      <h3 className="font-semibold text-foreground">Legend</h3>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-start gap-2">
            <span
              className="mt-0.5 inline-block h-3 w-3 shrink-0 rounded-full border border-white shadow"
              style={{ backgroundColor: item.color }}
              aria-hidden
            />
            <span>
              <span className="font-medium text-foreground">{item.label}</span>
              {item.description ? (
                <span className="block text-muted-foreground">{item.description}</span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
