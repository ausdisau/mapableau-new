import Link from "next/link";

import { EmbedWidgetTelemetry } from "@/components/embed/EmbedWidgetTelemetry";
import { CANONICAL_PRODUCTION_ORIGIN } from "@/lib/config/canonical-url";

type Props = {
  locationId: string;
};

/**
 * Full-viewport embed shell: 3D map placeholder + MapAble attribution.
 */
export function EmbedMapFrame({ locationId }: Props) {
  return (
    <div className="relative flex h-dvh w-full flex-col bg-slate-950 text-slate-100">
      <EmbedWidgetTelemetry locationId={locationId} />

      <div
        className="relative min-h-0 flex-1 overflow-hidden"
        role="img"
        aria-label={`MapAble 3D accessibility map for location ${locationId}`}
      >
        {/* Placeholder for Mapbox/WebGL canvas — scaffold only */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/40 via-slate-950 to-slate-950" />
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(148_163_184/0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgb(148_163_184/0.15)_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="font-heading text-2xl font-semibold tracking-tight">
            3D accessibility map
          </p>
          <p className="max-w-md text-sm text-slate-300">
            Interactive Mapbox / WebGL canvas placeholder for location{" "}
            <span className="font-medium text-white">{locationId}</span>.
          </p>
        </div>
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
