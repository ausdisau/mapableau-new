"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

import { SponsoredPhrase } from "@/components/ads/mapable/SponsoredPhrase";
import { isClientSponsoredPhraseEnabled } from "@/lib/ads/config/client-flags";
import { SYNTHETIC_PHRASE_TOPIC_WHATS_ON } from "@/lib/ads/fixtures/synthetic-sponsored-phrase";
import {
  readShowSponsoredLinks,
  setShowSponsoredLinks,
  SPONSORED_LINKS_PREFERENCE_CHANGE_EVENT,
} from "@/lib/ads/preferences/sponsored-links-preference";
import { resolveSponsoredPhrase } from "@/lib/ads/sponsored-phrase/resolve-sponsored-phrase";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export type SponsoredPhrasePlacementProps = {
  /** Current route path — closed allowlist; default homepage. */
  routePath?: string;
  /** Static editorial topic key. */
  topicKey?: string;
  restoreFocusId?: string;
};

/**
 * Client gate for the Explore sponsored-phrase pilot.
 * Renders nothing (no placeholder, no ad request) when flags, preference,
 * route, or creative gates fail.
 */
export function SponsoredPhrasePlacement({
  routePath = "/",
  topicKey = SYNTHETIC_PHRASE_TOPIC_WHATS_ON,
  restoreFocusId = "explore-features-heading",
}: SponsoredPhrasePlacementProps) {
  const featureEnabled = isClientSponsoredPhraseEnabled();
  const [showSponsoredLinks, setShow] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setShow(readShowSponsoredLinks());
    setHydrated(true);

    const onChange = () => setShow(readShowSponsoredLinks());
    window.addEventListener(SPONSORED_LINKS_PREFERENCE_CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(
        SPONSORED_LINKS_PREFERENCE_CHANGE_EVENT,
        onChange,
      );
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const result = useMemo(() => {
    if (!featureEnabled || !hydrated) {
      return { ok: false as const, reasonCode: "FEATURE_FLAG_OFF" as const };
    }
    return resolveSponsoredPhrase(
      { routePath, topicKey },
      {
        showSponsoredLinks,
        env: {
          MAPABLE_ADS_ENABLED: "true",
          MAPABLE_ADS_SPONSORED_PHRASE_ENABLED: "true",
          MAPABLE_ADS_GLOBAL_KILL_SWITCH: "false",
        },
      },
    );
  }, [featureEnabled, hydrated, routePath, topicKey, showSponsoredLinks]);

  const handleHide = useCallback(() => {
    setShowSponsoredLinks(false);
    setShow(false);
  }, []);

  const handleShow = useCallback(() => {
    setShowSponsoredLinks(true);
    setShow(true);
  }, []);

  // Feature off: render nothing — no preference chrome, no ad request.
  if (!featureEnabled) {
    return null;
  }

  // Avoid SSR/client mismatch before localStorage is read.
  if (!hydrated) {
    return null;
  }

  if (result.ok) {
    return (
      <SponsoredPhrase
        creative={result.creative}
        onHide={handleHide}
        restoreFocusId={restoreFocusId}
      />
    );
  }

  // Preference off (or no fill): offer a reversible opt-in without signing in.
  // Still no ad request / impression network call.
  if (!showSponsoredLinks) {
    return (
      <div className="mt-8 max-w-3xl border-t border-slate-200 pt-6">
        <button
          type="button"
          id="sponsored-links-preference-control"
          className={`text-sm font-semibold text-slate-600 underline-offset-2 hover:underline ${mapableCareFocusRing} rounded-sm`}
          onClick={handleShow}
        >
          Show sponsored links
        </button>
      </div>
    );
  }

  return null;
}
