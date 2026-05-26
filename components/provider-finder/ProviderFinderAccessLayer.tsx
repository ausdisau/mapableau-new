"use client";

import { MapPin } from "lucide-react";

import { cn } from "@/app/lib/utils";
import type { Provider } from "@/app/provider-finder/providers";

type ProviderFinderAccessLayerProps = {
  providers: Provider[];
  selectedId?: string;
  onSelect?: (provider: Provider) => void;
  className?: string;
};

function formatDistance(provider: Provider) {
  if (provider.suburb === "Remote") return "Telehealth";
  if (provider.distanceKm > 0) return `${provider.distanceKm.toFixed(1)} km`;
  return provider.suburb;
}

export function ProviderFinderAccessLayer({
  providers,
  selectedId,
  onSelect,
  className,
}: ProviderFinderAccessLayerProps) {
  const markers = providers.slice(0, 3);

  return (
    <aside
      id="map"
      className={cn(
        "hidden xl:flex xl:w-72 xl:shrink-0 xl:flex-col",
        className,
      )}
      aria-label="MapAble access layer"
    >
      <div className="relative flex flex-1 flex-col rounded-[1.6rem] border border-slate-200 bg-[#EAF5F5] p-5 shadow-sm">
        <div className="relative mx-auto flex min-h-[280px] w-full flex-1 flex-col justify-between py-8">
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full text-white"
            viewBox="0 0 200 280"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d="M 100 20 Q 160 80 120 140 T 100 260"
              fill="none"
              stroke="currentColor"
              strokeWidth="14"
              strokeLinecap="round"
            />
          </svg>

          {markers.map((provider, index) => {
            const positions = [
              "self-start ml-2",
              "self-center",
              "self-end mr-2",
            ] as const;
            return (
              <button
                key={provider.id}
                type="button"
                onClick={() => onSelect?.(provider)}
                className={cn(
                  "relative z-10 max-w-[210px] rounded-xl border border-slate-200 bg-white/95 p-3 text-left text-xs shadow-lg transition hover:border-primary/30 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40",
                  positions[index],
                  selectedId === provider.id &&
                    "border-primary ring-4 ring-primary/20",
                )}
              >
                <div className="flex items-start gap-2">
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-black leading-tight text-foreground line-clamp-2">
                      {provider.name}
                    </p>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                      {formatDistance(provider)}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
            MapAble access layer
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            The map view shows nearby providers, transport options, travel
            buffers, and venue access notes so you can plan before you book.
          </p>
        </div>
      </div>
    </aside>
  );
}
