"use client";

import Link from "next/link";
import React, { useEffect, useRef } from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import {
  mapablePublicPrimaryButtonClass,
  mapablePublicSecondaryButtonClass,
} from "@/lib/marketing/public-page-styles";
import {
  formatAccessGuideStatusKey,
  type AccessGuide,
} from "@/lib/resources/access-guides-data";

type GuideMarkerPopupProps = {
  guide: AccessGuide;
  onClose: () => void;
};

export function GuideMarkerPopup({ guide, onClose }: GuideMarkerPopupProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const reportHref = `/contact?topic=accessibility&subject=${encodeURIComponent(
    `Access update: ${guide.title}`,
  )}`;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby={`guide-popup-${guide.id}-title`}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#005B7F]">
            {guide.state} · {guide.tier}
          </p>
          <h3
            id={`guide-popup-${guide.id}-title`}
            className="mt-2 text-base font-black text-[#0C1833]"
          >
            {guide.title}
          </h3>
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 text-sm font-bold text-[#0C1833] ${mapableCareFocusRing}`}
          aria-label="Close guide popup"
        >
          Close
        </button>
      </div>
      <p className="mt-2 text-xs font-semibold text-slate-500">
        {formatAccessGuideStatusKey(guide.statusKey)}
      </p>
      <p className="mt-3 text-sm leading-7 text-slate-700">{guide.summary}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={guide.href}
          className={`${mapablePublicPrimaryButtonClass} ${mapableCareFocusRing}`}
        >
          Open guide
        </Link>
        <Link
          href={reportHref}
          className={`${mapablePublicSecondaryButtonClass} ${mapableCareFocusRing}`}
        >
          Report an access update
        </Link>
      </div>
    </div>
  );
}
