"use client";

import React, { type CSSProperties } from "react";

export function MapAbleCareTypography() {
  return null;
}

/**
 * Decorative wavy letterforms for marketing headlines.
 * Assistive tech and selection receive the plain sentence via sr-only text;
 * visual letter spans are aria-hidden (no role="img" on headings).
 */
export function WavyText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  let letterIndex = 0;
  return (
    <span className={`mapable-display ${className}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="select-none">
        {text.split(" ").map((word, wordIndex) => (
          <span
            key={`${word}-${wordIndex}`}
            className="mapable-wavy-word"
          >
            {word.split("").map((letter) => {
              const y = ["0em", "-0.03em", "0.02em", "-0.02em", "0.025em"][
                letterIndex % 5
              ];
              const r = ["-0.9deg", "0.7deg", "-0.5deg", "0.85deg", "-0.65deg"][
                letterIndex % 5
              ];
              letterIndex += 1;
              return (
                <span
                  key={`${letter}-${letterIndex}`}
                  className="mapable-wavy-letter"
                  style={
                    {
                      "--wave-y": y,
                      "--wave-r": r,
                    } as CSSProperties
                  }
                >
                  {letter}
                </span>
              );
            })}
          </span>
        ))}
      </span>
    </span>
  );
}

/** @deprecated Use MapAbleCareTypography — kept for homepage re-exports. */
export function MapAbleCareMarketingTypography() {
  return <MapAbleCareTypography />;
}
