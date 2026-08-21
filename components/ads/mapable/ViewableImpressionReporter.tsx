"use client";

import { useEffect, useRef } from "react";

type ViewableImpressionReporterProps = {
  impressionId: string | null | undefined;
  /** 'display' = 50% visible for 1s; 'marker' = in viewport + idle map for 1s */
  mode?: "display" | "marker";
  mapIdle?: boolean;
  children: React.ReactNode;
  className?: string;
};

/**
 * Bills CPM only after viewability criteria. Dedupes per impression id.
 * Client never sends charge amounts.
 */
export function ViewableImpressionReporter({
  impressionId,
  mode = "display",
  mapIdle = true,
  children,
  className,
}: ViewableImpressionReporterProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const billedRef = useRef<string | null>(null);
  const visibleSinceRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!impressionId || billedRef.current === impressionId) return;
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const threshold = mode === "display" ? 0.5 : 0.01;

    const tryBill = () => {
      if (billedRef.current === impressionId) return;
      if (mode === "marker" && !mapIdle) return;
      billedRef.current = impressionId;
      void fetch("/api/ads/billing/viewable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ impressionId, viewable: true }),
      }).catch(() => {
        billedRef.current = null;
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
          if (visibleSinceRef.current == null) {
            visibleSinceRef.current = Date.now();
          }
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            if (
              visibleSinceRef.current != null &&
              Date.now() - visibleSinceRef.current >= 1000
            ) {
              tryBill();
            }
          }, 1000);
        } else {
          visibleSinceRef.current = null;
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
        }
      },
      { threshold: [0, threshold, 1] },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [impressionId, mode, mapIdle]);

  return (
    <div ref={rootRef} className={className} data-ads-viewability={mode}>
      {children}
    </div>
  );
}
