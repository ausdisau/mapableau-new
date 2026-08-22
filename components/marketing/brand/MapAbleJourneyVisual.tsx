"use client";

import { useId } from "react";

/**
 * Decorative logo-derived landscape: pin, path, and cool-to-warm progression.
 * Meaning lives in adjacent copy — this graphic is not required to understand the page.
 */
export function MapAbleJourneyVisual({
  className = "",
}: {
  className?: string;
}) {
  const reactId = useId().replace(/:/g, "");
  const gradientId = `mapable-journey-gradient-${reactId}`;
  const pathId = `mapable-journey-route-${reactId}`;

  return (
    <svg
      viewBox="0 0 480 420"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="40" y1="80" x2="440" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1E5A8A" />
          <stop offset="0.36" stopColor="#72549D" />
          <stop offset="0.7" stopColor="#F47A2A" />
          <stop offset="1" stopColor="#F1B51C" />
        </linearGradient>
      </defs>
      <path
        d="M92 392c18-74 48-132 92-168 14-48 48-92 108-108 42-12 86 2 118 38 22 24 36 56 42 94 8 52-6 108-48 154"
        fill={`url(#${gradientId})`}
        opacity="0.16"
      />
      <path
        d="M48 388 108 268l46 42 72-118 52 86 78-132 62 88 34 154H48Z"
        fill={`url(#${gradientId})`}
      />
      <path
        id={pathId}
        d="M72 372c38-42 62-58 88-64 36-8 52 18 86 8 28-8 46-38 78-52 24-10 48-8 72 6"
        fill="none"
        stroke="#fff"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g transform="translate(248 28)">
        <path
          fill={`url(#${gradientId})`}
          d="M72 0c-32 0-58 25.4-58 56.8 0 40.6 58 95.2 58 95.2s58-54.6 58-95.2C130 25.4 104 0 72 0Z"
        />
        <g fill="#fff" transform="translate(72 54)">
          <circle cx="1.2" cy="-16.5" r="5.6" />
          <path d="M-1.4-9.4c2.4-.2 4.8.6 6.6 2.2l8.2 7.4c1.3 1.2.4 3.4-1.4 3.4h-2.2l-5.2-4.6.8 4.8c.3 1.6-.6 3.2-2.2 3.8l-7.2 2.6c-1.4.5-2.9-.4-3.2-1.8l-1-5.2-4.6 1.4c-1.3.4-2.6-.5-2.8-1.8-.3-1.6.8-3 2.4-3.3l6.4-1.2 1.2-6.4c.3-1.4 1.6-2.4 3-2.3Z" />
          <circle
            cx="-4.2"
            cy="11.2"
            r="10.4"
            fill="none"
            stroke="#fff"
            strokeWidth="3.5"
          />
          <circle cx="-4.2" cy="11.2" r="3.2" />
        </g>
      </g>
      <circle cx="160" cy="308" r="9" fill="#fff" />
      <circle cx="160" cy="308" r="4.5" fill="#1E5A8A" />
      <circle cx="246" cy="314" r="9" fill="#fff" />
      <circle cx="246" cy="314" r="4.5" fill="#72549D" />
      <circle cx="324" cy="268" r="9" fill="#fff" />
      <circle cx="324" cy="268" r="4.5" fill="#F47A2A" />
      <circle cx="396" cy="270" r="9" fill="#fff" />
      <circle cx="396" cy="270" r="4.5" fill="#F1B51C" />
    </svg>
  );
}
