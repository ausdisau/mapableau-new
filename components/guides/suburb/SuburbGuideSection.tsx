import React, { type ReactNode } from "react";

import {
  mapablePublicCardClass,
  mapablePublicMutedCardClass,
} from "@/lib/marketing/public-page-styles";

type SuburbGuideSectionProps = {
  id: string;
  title: string;
  children: ReactNode;
  tone?: "default" | "soft" | "warning";
};

export function SuburbGuideSection({
  id,
  title,
  children,
  tone = "default",
}: SuburbGuideSectionProps) {
  const toneClass =
    tone === "warning"
      ? "border-amber-200 bg-amber-50"
      : tone === "soft"
        ? mapablePublicMutedCardClass
        : mapablePublicCardClass;

  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`${toneClass} scroll-mt-24`}
    >
      <h2
        id={`${id}-heading`}
        className="text-lg font-black text-[#0C1833] sm:text-xl"
      >
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
        {children}
      </div>
    </section>
  );
}
