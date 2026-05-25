"use client";

import dynamic from "next/dynamic";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

export function ProviderFinderMap({
  providers = [],
  userPosition = null,
  fullscreen,
}: {
  providers?: import("@/app/provider-finder/providers").Provider[];
  userPosition?: { lat: number; lng: number } | null;
  fullscreen?: boolean;
}) {
  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-50 bg-background pt-[env(safe-area-inset-top)]"
          : "h-64 w-full overflow-hidden rounded-xl border border-border md:h-96"
      }
      role="region"
      aria-label="Provider map"
    >
      <Map providers={providers} userPosition={userPosition} />
    </div>
  );
}
