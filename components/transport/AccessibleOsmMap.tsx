"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

import type { AccessibleMapPoint } from "@/components/transport/AccessibleOsmMapInner";

const AccessibleOsmMapInner = dynamic(
  () =>
    import("@/components/transport/AccessibleOsmMapInner").then(
      (m) => m.AccessibleOsmMapInner
    ),
  {
    ssr: false,
    loading: () => (
      <p className="tb-ink-secondary text-sm" role="status">
        Loading interactive map…
      </p>
    ),
  }
);

type Props = {
  points: AccessibleMapPoint[];
  announcement?: string;
  enabled?: boolean;
};

/**
 * Leaflet + OSM map for transport booking. SSR-safe via next/dynamic.
 * List/stepper content must remain usable when this is hidden.
 */
export function AccessibleOsmMap({
  points,
  announcement,
  enabled = true,
}: Props) {
  const liveAnnouncement = useMemo(() => {
    if (announcement) return announcement;
    if (points.length === 0) {
      return "No map pins yet. Enter pickup and drop-off addresses in the list view.";
    }
    return `Map shows ${points.length} location marker${points.length === 1 ? "" : "s"}: ${points
      .map((p) => p.label)
      .join("; ")}.`;
  }, [announcement, points]);

  if (!enabled) {
    return (
      <p className="tb-ink-secondary text-sm" role="status">
        Map hidden — list view is complete without map scripts.
      </p>
    );
  }

  if (points.length === 0) {
    return (
      <div
        className="tb-surface flex min-h-[280px] items-center justify-center p-6"
        role="region"
        aria-label="Interactive accessible transport map"
      >
        <p className="tb-ink-secondary text-center text-sm">
          Enter journey endpoints to preview pins. Exact coordinates stay
          privacy-masked until assignment.
        </p>
        <div aria-live="polite" className="sr-only">
          {liveAnnouncement}
        </div>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Interactive accessible transport map"
      className="h-full min-h-[280px]"
    >
      <AccessibleOsmMapInner
        points={points}
        announcement={liveAnnouncement}
      />
    </div>
  );
}
