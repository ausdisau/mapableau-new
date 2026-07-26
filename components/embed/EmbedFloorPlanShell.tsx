"use client";

import { useMemo, useRef, useState } from "react";
import { Crosshair, ZoomIn, ZoomOut } from "lucide-react";

import { FloorPlanCanvas } from "@/components/accessibility-map/floor-plan/FloorPlanCanvas";
import { useFloorPlanPanZoom } from "@/hooks/useFloorPlanPanZoom";
import type { FloorPlanDetail } from "@/lib/floor-plan/schemas";

type Props = {
  locationId: string;
  plan: FloorPlanDetail;
  venueName: string;
};

/**
 * Lightweight embed canvas: FloorPlanCanvas + pan/zoom a11y controls.
 * No main app chrome — attribution lives in EmbedMapFrame footer.
 */
export function EmbedFloorPlanShell({ locationId, plan, venueName }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const panZoom = useFloorPlanPanZoom(containerRef);
  const [canvasFocused, setCanvasFocused] = useState(false);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | undefined>();
  const [imageError, setImageError] = useState(false);

  const visibleFeatures = useMemo(() => plan.features, [plan.features]);

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <p className="truncate text-xs text-slate-300">
          <span className="font-medium text-white">{venueName}</span>
          <span className="text-slate-500"> · </span>
          {plan.floorName}
        </p>
        <div
          className="flex items-center gap-1"
          role="toolbar"
          aria-label="Floor plan zoom controls"
        >
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 bg-white/5 text-cyan-200 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
            aria-label="Zoom in"
            onClick={() => panZoom.zoomIn()}
          >
            <ZoomIn className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 bg-white/5 text-cyan-200 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
            aria-label="Zoom out"
            onClick={() => panZoom.zoomOut()}
          >
            <ZoomOut className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 bg-white/5 text-cyan-200 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
            aria-label="Fit to screen"
            onClick={() => panZoom.fitToScreen()}
          >
            <Crosshair className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {imageError ? (
        <p
          className="shrink-0 border-b border-amber-500/40 bg-amber-950/50 px-3 py-2 text-xs text-amber-100"
          role="alert"
        >
          Floor plan image could not be loaded. Feature markers remain interactive.
        </p>
      ) : null}

      <div ref={containerRef} className="min-h-0 flex-1 p-2 [&_.fp-canvas-container]:min-h-full [&_.fp-canvas-container]:rounded-lg [&_.fp-canvas-container]:border-slate-700 [&_.fp-canvas-container]:bg-slate-900">
        <FloorPlanCanvas
          plan={plan}
          visibleFeatures={visibleFeatures}
          selectedFeatureId={selectedFeatureId}
          onSelectFeature={setSelectedFeatureId}
          onImageError={() => setImageError(true)}
          isFocused={canvasFocused}
          onFocus={() => setCanvasFocused(true)}
          onBlur={() => setCanvasFocused(false)}
          onKeyboardPan={panZoom.panBy}
          panZoom={panZoom}
        />
      </div>

      <p id="fp-keyboard-help" className="sr-only">
        Accessible floor plan for location {locationId}. When focused, use arrow
        keys to pan, plus and minus to zoom, and zero to fit.
      </p>
    </div>
  );
}
