"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/app/lib/utils";

type AdSenseSkyscraperUnitProps = {
  adSlot: string;
  adClient: string;
  side: "left" | "right";
  className?: string;
};

export function AdSenseSkyscraperUnit({
  adSlot,
  adClient,
  side,
  className,
}: AdSenseSkyscraperUnitProps) {
  const pushedRef = useRef(false);

  useEffect(() => {
    if (pushedRef.current) return;
    pushedRef.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.warn("[AdSense] failed to initialise skyscraper unit", error);
    }
  }, [adSlot]);

  return (
    <aside
      aria-label="Advertisement"
      className={cn(
        "hidden w-full shrink-0 xl:block",
        side === "left" ? "justify-self-end" : "justify-self-start",
        className,
      )}
    >
      <div
        className={cn(
          "sticky top-[calc(var(--mapable-header-offset,5rem)+1rem)]",
          "max-h-[calc(100vh-var(--mapable-header-offset,5rem)-2rem)]",
        )}
      >
        <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Advertisement
        </p>
        <ins
          className="adsbygoogle block overflow-hidden rounded-lg border border-border bg-card shadow-sm"
          style={{ display: "inline-block", width: 160, height: 600 }}
          data-ad-client={adClient}
          data-ad-slot={adSlot}
          data-ad-format="vertical"
          data-full-width-responsive="false"
        />
      </div>
    </aside>
  );
}
