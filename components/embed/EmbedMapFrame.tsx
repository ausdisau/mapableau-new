import Link from "next/link";

import { EmbedFloorPlanShell } from "@/components/embed/EmbedFloorPlanShell";
import { EmbedWidgetTelemetry } from "@/components/embed/EmbedWidgetTelemetry";
import { CANONICAL_PRODUCTION_ORIGIN } from "@/lib/config/canonical-url";
import { resolveEmbedFloorPlan } from "@/lib/embed/resolve-embed-floor-plan";

type Props = {
  locationId: string;
};

/**
 * Full-viewport embed shell: FloorPlanCanvas + MapAble attribution.
 */
export function EmbedMapFrame({ locationId }: Props) {
  const { plan, venueName } = resolveEmbedFloorPlan(locationId);

  return (
    <div className="relative flex h-dvh w-full flex-col bg-slate-950 text-slate-100">
      <EmbedWidgetTelemetry locationId={locationId} />

      <div
        className="relative min-h-0 flex-1 overflow-hidden"
        aria-label={`MapAble accessibility floor plan for location ${locationId}`}
      >
        <EmbedFloorPlanShell
          locationId={locationId}
          plan={plan}
          venueName={venueName}
        />
      </div>

      <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-white/10 bg-slate-950/90 px-3 py-2 text-xs text-slate-300 backdrop-blur">
        <span className="truncate">Location {locationId}</span>
        <Link
          href={`${CANONICAL_PRODUCTION_ORIGIN}/?utm_source=embed_watermark`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 font-medium text-cyan-300 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
        >
          Powered by MapAble
        </Link>
      </footer>
    </div>
  );
}
