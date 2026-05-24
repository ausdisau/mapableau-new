import React, { type CSSProperties } from "react";

import { cn } from "@/app/lib/utils";

/** Static per-letter offsets — no animation (accessibility). */
const WAVE_PATTERN: Array<{ y: string; r: string }> = [
  { y: "0em", r: "0deg" },
  { y: "-0.06em", r: "-2deg" },
  { y: "0.04em", r: "1.5deg" },
  { y: "-0.08em", r: "-1deg" },
  { y: "0.05em", r: "2deg" },
  { y: "-0.04em", r: "-1.5deg" },
  { y: "0.07em", r: "1deg" },
  { y: "-0.05em", r: "-2deg" },
];

function waveStyle(index: number): CSSProperties {
  const p = WAVE_PATTERN[index % WAVE_PATTERN.length];
  return {
    ["--wave-y" as string]: p.y,
    ["--wave-r" as string]: p.r,
  };
}

export function WavyText({
  text,
  className,
  as: Tag = "span",
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}) {
  const words = text.split(/\s+/).filter(Boolean);

  return (
    <Tag
      className={cn("mapable-display", className)}
      aria-label={text}
    >
      {words.map((word, wi) => (
        <span key={`${word}-${wi}`} className="mapable-wavy-word" aria-hidden>
          {word.split("").map((char, ci) => {
            const index = wi * 12 + ci;
            return (
              <span
                key={`${wi}-${ci}`}
                className="mapable-wavy-letter"
                style={waveStyle(index)}
                aria-hidden
              >
                {char}
              </span>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}
