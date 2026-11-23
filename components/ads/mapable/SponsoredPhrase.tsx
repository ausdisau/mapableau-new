"use client";

import React, { useId, useRef, useState } from "react";

import type { SponsoredPhraseCreative } from "@/lib/ads/types";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export type SponsoredPhraseProps = {
  creative: SponsoredPhraseCreative;
  onHide: () => void;
  /** Element id to restore focus after hide (stable page control). */
  restoreFocusId?: string;
  className?: string;
};

/**
 * First-party authored sponsored sentence with one native sponsor link.
 * Disclosure is visible before the sentence; destination opens only on click.
 */
export function SponsoredPhrase({
  creative,
  onHide,
  restoreFocusId = "explore-features-heading",
  className,
}: SponsoredPhraseProps) {
  const whyId = useId();
  const [whyOpen, setWhyOpen] = useState(false);
  const whyButtonRef = useRef<HTMLButtonElement>(null);

  const accessibleLinkName = `Advertisement, paid for by ${creative.payerName}: ${creative.linkedPhrase}`;

  const handleHide = () => {
    onHide();
    // Restore focus to a stable page control after dismissal.
    requestAnimationFrame(() => {
      const target =
        (restoreFocusId
          ? document.getElementById(restoreFocusId)
          : null) ??
        document.getElementById("sponsored-links-preference-control");
      if (target instanceof HTMLElement) {
        target.focus();
      }
    });
  };

  return (
    <aside
      className={
        className ??
        "mt-8 max-w-3xl border-t border-slate-200 pt-6 text-base leading-7 text-slate-700"
      }
      data-ads-sponsored-phrase={creative.id}
      data-ads-placement="explore.topic.sponsored-phrase"
      aria-label="Advertisement"
    >
      <p className="text-sm font-semibold text-slate-600">
        Advertisement · Paid for by {creative.payerName}
      </p>
      <p className="mt-2">
        {creative.prefixText}
        <a
          href={creative.destinationUrl}
          rel="sponsored noreferrer"
          referrerPolicy="no-referrer"
          target="_blank"
          className={`underline decoration-2 underline-offset-2 text-[#005B7F] hover:text-[#004766] ${mapableCareFocusRing} rounded-sm`}
          aria-label={accessibleLinkName}
          data-ads-sponsored-phrase-link="true"
        >
          {creative.linkedPhrase}
        </a>
        {creative.suffixText}
      </p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <button
          type="button"
          ref={whyButtonRef}
          className={`font-semibold text-[#005B7F] underline-offset-2 hover:underline ${mapableCareFocusRing} rounded-sm`}
          aria-expanded={whyOpen}
          aria-controls={whyId}
          onClick={() => setWhyOpen((open) => !open)}
        >
          Why this ad?
        </button>
        <button
          type="button"
          className={`font-semibold text-slate-700 underline-offset-2 hover:underline ${mapableCareFocusRing} rounded-sm`}
          onClick={handleHide}
        >
          Hide sponsored links
        </button>
      </div>
      {whyOpen ? (
        <p
          id={whyId}
          className="mt-3 max-w-2xl text-sm leading-6 text-slate-600"
          role="region"
          aria-label="Why this advertisement"
        >
          {creative.whyThisAd}
        </p>
      ) : null}
    </aside>
  );
}
