"use client";

import Image from "next/image";
import { useEffect, useId, useState } from "react";

import { MAPABLE_LOGO_SRC, MAPABLE_LOGO_ALT } from "@/lib/brand/constants";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import { cn } from "@/app/lib/utils";

const CONCEPT_CAPTION =
  "Concept visualisation — routes illustrative; accessibility not verified.";

/** Committed runtime exports — only enable playback when these exist. */
export const SEARCH_CAMPAIGN_POSTER_SRC =
  "/brand/mapable-search/sydney-network-poster.webp";
export const SEARCH_CAMPAIGN_STORYBOARD_SRC =
  "/brand/mapable-search/sydney-storyboard.mp4";

type Props = {
  className?: string;
  /**
   * When true, treat campaign storyboard media as available.
   * Defaults to a HEAD probe of the committed storyboard path.
   */
  campaignMediaReady?: boolean;
};

async function probeCampaignMedia(): Promise<boolean> {
  try {
    const response = await fetch(SEARCH_CAMPAIGN_STORYBOARD_SRC, {
      method: "HEAD",
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Hero visual for MapAble Search.
 * Uses the official brand lockup until approved Sydney campaign media is imported.
 * Never autoplays animated sequences; respects reduced motion.
 */
export function MapAbleSearchMedia({ className, campaignMediaReady }: Props) {
  const videoId = useId();
  const [mediaReady, setMediaReady] = useState(Boolean(campaignMediaReady));
  const [showVideo, setShowVideo] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPrefersReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (typeof campaignMediaReady === "boolean") {
      setMediaReady(campaignMediaReady);
      return;
    }
    let cancelled = false;
    void probeCampaignMedia().then((ready) => {
      if (!cancelled) setMediaReady(ready);
    });
    return () => {
      cancelled = true;
    };
  }, [campaignMediaReady]);

  const canPlay = mediaReady && !prefersReducedMotion;

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

        {mediaReady && !showVideo ? (
          <Image
            src={SEARCH_CAMPAIGN_POSTER_SRC}
            alt="Illustrative Sydney network concept art for MapAble Search. Routes are not access-verified."
            width={800}
            height={450}
            className="relative z-[1] h-auto w-full max-w-md rounded-2xl object-cover"
            priority
            onError={() => setMediaReady(false)}
          />
        ) : null}

        {!mediaReady ? (
          <>
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
          </>
        ) : null}

        {showVideo && canPlay ? (
          <video
            id={videoId}
            className="relative z-[1] w-full max-w-md rounded-2xl bg-black"
            controls
            playsInline
            preload="none"
            poster={SEARCH_CAMPAIGN_POSTER_SRC}
          >
            <source src={SEARCH_CAMPAIGN_STORYBOARD_SRC} type="video/mp4" />
            Your browser does not support the storyboard video. Use the still
            poster and caption instead.
          </video>
        ) : null}

        <button
          type="button"
          disabled={!canPlay}
          aria-disabled={!canPlay}
          aria-controls={showVideo && canPlay ? videoId : undefined}
          title={
            prefersReducedMotion
              ? "Animation hidden because reduced motion is preferred"
              : canPlay
                ? "Play silent Sydney concept storyboard"
                : "Campaign storyboard media is not available yet"
          }
          onClick={() => {
            if (!canPlay) return;
            setShowVideo(true);
          }}
          className={cn(
            "relative z-[1] inline-flex min-h-11 min-w-[11rem] items-center justify-center rounded-xl border-2 border-[#005B7F] px-4 text-sm font-black text-[#005B7F] transition",
            canPlay ? "hover:bg-[#005B7F]/5" : "cursor-not-allowed opacity-60",
            mapableCareFocusRing,
            "motion-reduce:transition-none",
          )}
        >
          {prefersReducedMotion
            ? "Animation paused (reduced motion)"
            : canPlay
              ? showVideo
                ? "Storyboard ready"
                : "Explore Sydney concept animation"
              : "Explore Sydney concept animation"}
        </button>
      </div>
      <figcaption className="mt-4 text-center text-xs font-semibold text-slate-600">
        {CONCEPT_CAPTION}
      </figcaption>
    </figure>
  );
}
