import React from "react";

import { homepageTrustStripItems } from "@/lib/marketing/mapable-care-combined-data";

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0">
      <path
        d="m8.5 12.2 2.4 2.4 5.1-5.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TrustStrip({
  tone = "light",
}: {
  tone?: "light" | "onDark";
}) {
  const textClass =
    tone === "onDark" ? "text-white/80" : "text-slate-600";
  const iconClass =
    tone === "onDark" ? "text-[#F26A21]" : "text-[#3B5BDB]";

  return (
    <ul
      aria-label="MapAble trust highlights"
      className={`mt-0 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold ${textClass}`}
    >
      {homepageTrustStripItems.map((item) => (
        <li key={item} className="inline-flex min-h-11 items-center gap-2">
          <span className={iconClass}>
            <CheckIcon />
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
