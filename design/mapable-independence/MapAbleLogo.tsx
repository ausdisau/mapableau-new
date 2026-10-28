import type { CSSProperties } from "react";

export interface MapAbleLogoProps {
  /** Deploy the unchanged supplied PNG at this URL. Never point to a compact mark. */
  src?: string;
  /** The whole image, including whitespace, wordmark and baked-in tagline. */
  size?: number;
  className?: string;
  priority?: boolean;
}

/** Native img is intentional: no next/image dependency, transform or optimization. */
export function MapAbleLogo({
  src = "/brand/mapable-independence.png",
  size = 240,
  className = "",
  priority = false,
}: MapAbleLogoProps) {
  return (
    <img
      src={src}
      alt="MapAble — Empowering Independence"
      width={1254}
      height={1254}
      className={`ma-logo ${className}`}
      style={{ "--ma-logo-size": `${size}px` } as CSSProperties}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
    />
  );
}
