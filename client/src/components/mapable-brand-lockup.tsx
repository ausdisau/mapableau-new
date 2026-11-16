import { cn } from "@/lib/utils";
import { mapableBrand, mapableBrandAssets } from "@/lib/brand";

type MapAbleClientLockupProps = {
  className?: string;
  /** Compact mark only (sidebar collapsed). */
  variant?: "header" | "mark";
  imageClassName?: string;
  showTagline?: boolean;
  "data-testid"?: string;
};

export function MapAbleClientLockup({
  className,
  variant = "header",
  imageClassName,
  showTagline = true,
  "data-testid": dataTestId,
}: MapAbleClientLockupProps) {
  const isMark = variant === "mark";

  return (
    <span className={cn("inline-flex min-w-0 flex-col items-center gap-1.5", className)}>
      <img
        src={isMark ? mapableBrandAssets.mark : mapableBrandAssets.wordmark}
        alt={mapableBrandAssets.wordmarkAlt}
        className={cn(
          "shrink-0 bg-transparent object-contain object-left",
          isMark ? "h-8 w-8" : "h-12 w-auto max-w-[11rem] sm:max-w-[12rem]",
          imageClassName,
        )}
        decoding="async"
        fetchpriority="high"
        data-testid={dataTestId}
      />
      {showTagline && !isMark ? (
        <span
          className={cn(
            "inline-flex w-fit max-w-full items-center justify-center rounded-full px-3 py-1 text-center text-[0.62rem] font-black uppercase leading-none tracking-[0.1em]",
            "bg-[#0C1833] text-[#F8C51C]",
          )}
        >
          {mapableBrand.tagline}
        </span>
      ) : null}
    </span>
  );
}