"use client";

import { cn } from "@/app/lib/utils";
import {
  ACCESS_NEEDS,
  FUNDING_OPTIONS,
  SUPPORT_TYPES,
  type SupportTypeId,
} from "@/lib/provider-finder/filters";
import type { MapLayerVisibility } from "@/lib/map/fetch-map-layers";

type ProviderFinderSidebarProps = {
  supportType: SupportTypeId;
  onSupportTypeChange: (id: SupportTypeId) => void;
  accessNeeds: string[];
  onAccessNeedsChange: (ids: string[]) => void;
  funding: (typeof FUNDING_OPTIONS)[number]["id"];
  onFundingChange: (id: (typeof FUNDING_OPTIONS)[number]["id"]) => void;
  layerVisibility: MapLayerVisibility;
  onLayerVisibilityChange: (next: MapLayerVisibility) => void;
  isSignedIn: boolean;
};

const MAP_LAYERS: Array<{
  key: keyof MapLayerVisibility;
  label: string;
  colorClass: string;
  signedInOnly?: boolean;
}> = [
  { key: "access", label: "Access places", colorClass: "bg-amber-600" },
  {
    key: "care",
    label: "Your care shifts",
    colorClass: "bg-violet-600",
    signedInOnly: true,
  },
  {
    key: "transport",
    label: "Your transport",
    colorClass: "bg-blue-600",
    signedInOnly: true,
  },
];

export function ProviderFinderSidebar({
  supportType,
  onSupportTypeChange,
  accessNeeds,
  onAccessNeedsChange,
  funding,
  onFundingChange,
  layerVisibility,
  onLayerVisibilityChange,
  isSignedIn,
}: ProviderFinderSidebarProps) {
  function toggleAccessNeed(id: string) {
    onAccessNeedsChange(
      accessNeeds.includes(id)
        ? accessNeeds.filter((x) => x !== id)
        : [...accessNeeds, id],
    );
  }

  function toggleLayer(key: keyof MapLayerVisibility) {
    onLayerVisibilityChange({
      ...layerVisibility,
      [key]: !layerVisibility[key],
    });
  }

  return (
    <aside
      className="space-y-8 rounded-xl border border-border/60 bg-card p-5 shadow-sm lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto"
      aria-label="Refine search"
    >
      <div>
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Refine search
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Narrow results by support type, access needs and funding.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground">Map layers</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Toggle what appears on the map after you search.
        </p>
        <ul className="mt-3 space-y-2">
          {MAP_LAYERS.map((layer) => {
            const disabled = layer.signedInOnly && !isSignedIn;
            const checked = layerVisibility[layer.key];
            return (
              <li key={layer.key}>
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm",
                    disabled && "cursor-not-allowed opacity-60",
                  )}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-input"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggleLayer(layer.key)}
                  />
                  <span
                    className={cn("h-2.5 w-2.5 shrink-0 rounded-full", layer.colorClass)}
                    aria-hidden
                  />
                  <span>{layer.label}</span>
                </label>
              </li>
            );
          })}
        </ul>
        {!isSignedIn ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Sign in to view your care and transport on the map.
          </p>
        ) : null}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground">Support type</h3>
        <ul className="mt-3 space-y-1">
          {SUPPORT_TYPES.map((type) => (
            <li key={type.id}>
              <button
                type="button"
                onClick={() => onSupportTypeChange(type.id)}
                className={cn(
                  "w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  supportType === type.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
                aria-pressed={supportType === type.id}
              >
                {type.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground">Access needs</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {ACCESS_NEEDS.map((need) => {
            const active = accessNeeds.includes(need.id);
            return (
              <button
                key={need.id}
                type="button"
                onClick={() => toggleAccessNeed(need.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:bg-accent",
                )}
                aria-pressed={active}
              >
                {need.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground">Funding</h3>
        <div className="mt-3 space-y-1">
          {FUNDING_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onFundingChange(option.id)}
              className={cn(
                "w-full rounded-lg px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                funding === option.id
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-accent",
              )}
              aria-pressed={funding === option.id}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
