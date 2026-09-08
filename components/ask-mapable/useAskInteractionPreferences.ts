"use client";

import { useEffect, useMemo, useState } from "react";

export type AskInformationDensity = "simpler" | "standard" | "detailed";

const DEFAULT_DENSITY: AskInformationDensity = "standard";

export function choiceLimitForInformationDensity(
  density: AskInformationDensity,
): number {
  switch (density) {
    case "simpler":
      return 1;
    case "detailed":
      return 6;
    case "standard":
    default:
      return 3;
  }
}

function parseInformationDensity(value: unknown): AskInformationDensity {
  return value === "simpler" || value === "detailed" || value === "standard"
    ? value
    : DEFAULT_DENSITY;
}

/**
 * Reads the participant's existing My MapAble presentation preference.
 *
 * This preference controls presentation only. It is not sent to the model and
 * must never change permissions, eligibility, ranking, safety gates or action
 * authority. If Personal Agency preferences are unavailable, Ask MapAble falls
 * back to the standard presentation.
 */
export function useAskInteractionPreferences() {
  const [informationDensity, setInformationDensity] =
    useState<AskInformationDensity>(DEFAULT_DENSITY);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const response = await fetch("/api/my/setup", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) return;

        const body = (await response.json()) as {
          preferences?: { informationDensity?: unknown } | null;
        };
        if (!active) return;

        setInformationDensity(
          parseInformationDensity(body.preferences?.informationDensity),
        );
      } catch {
        // Preferences are optional. Standard presentation remains the fallback.
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const maxVisibleChoices = useMemo(
    () => choiceLimitForInformationDensity(informationDensity),
    [informationDensity],
  );

  return { informationDensity, maxVisibleChoices } as const;
}
