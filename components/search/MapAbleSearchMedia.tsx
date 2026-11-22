"use client";

import Image from "next/image";

import { MAPABLE_LOGO_SRC, MAPABLE_LOGO_ALT } from "@/lib/brand/constants";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import { cn } from "@/app/lib/utils";

const CONCEPT_CAPTION =
  "Concept visualisation — routes illustrative; accessibility not verified.";

type Props = {
  className?: string;
  /** When true, campaign storyboard media is available for user-triggered playback. */
  campaignMediaReady?: boolean;
};

/**
 * Hero visual for MapAble Search.
 * Uses the official brand lockup until approved Sydney campaign media is imported.
 * Never autoplays animated sequences; respects reduced motion.
 */
export function MapAbleSearchMedia({
  className,
  campaignMediaReady = false,
}: Props) {
  return (
    <figure
      className={cn(
        "relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-[#F6FBFC] via-white to-[#E8F4F7] p-6 shadow-sm sm:p-8",
        className,
      )}
    >
      <div className="relative flex min-h-[14rem] flex-col items-center justify-center gap-6 sm:min-h-[18rem]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(0,91,127,0.12), transparent 45%), radial-gradient(circle at 80% 70%, rgba(0,169,121,0.12), transparent 40%)",
          }}
        />
        <Image
          src={MAPABLE_LOGO_SRC}
          alt={MAPABLE_LOGO_ALT}
          width={280}
          height={120}
          className="relative z-[1] h-auto w-[min(100%,16rem)] object-contain"
          priority
        />
        <p className="relative z-[1] max-w-sm text-center text-sm font-medium text-[#0C1833]/80">
          An accessible Australia — illustrative routes only until campaign
          media is approved.
        </p>
        <button
          type="button"
          disabled={!campaignMediaReady}
          aria-disabled={!campaignMediaReady}
          title={
            campaignMediaReady
              ? "Play silent Sydney storyboard"
              : "Campaign storyboard media is not available yet"
          }
          className={cn(
            "relative z-[1] inline-flex min-h-11 min-w-[11rem] items-center justify-center rounded-xl border-2 border-[#005B7F] px-4 text-sm font-black text-[#005B7F] transition",
            campaignMediaReady
              ? "hover:bg-[#005B7F]/5"
              : "cursor-not-allowed opacity-60",
            mapableCareFocusRing,
            "motion-reduce:transition-none",
          )}
        >
          {campaignMediaReady ? "Play storyboard" : "Playback unavailable"}
        </button>
      </div>
      <figcaption className="mt-4 text-center text-xs font-semibold text-slate-600">
        {CONCEPT_CAPTION}
      </figcaption>
    </figure>
  );
}
