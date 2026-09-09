"use client";

import { useEffect, useMemo, useState } from "react";

import { buildMapAblePersonaProfile } from "@/lib/interaction/persona-kernel";

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

function isInformationDensity(value: unknown): value is AskInformationDensity {
  return value === "simpler" || value === "detailed" || value === "standard";
}

function parseInformationDensity(value: unknown): AskInformationDensity {
  return isInformationDensity(value) ? value : DEFAULT_DENSITY;
}

function parseInterfaceMethods(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ).slice(0, 8);
}

function densityLabel(density: AskInformationDensity): string {
  switch (density) {
    case "simpler":
      return "one thing at a time";
    case "detailed":
      return "show me more";
    case "standard":
    default:
      return "a few choices";
  }
}

/**
 * Reads the participant's existing My MapAble presentation preferences and
 * builds the provider-neutral Persona Kernel view used by Companion.
 *
 * These preferences control presentation only. They are not sent to the model
 * by this hook and must never change permissions, eligibility, ranking, safety
 * gates or action authority. If preferences are unavailable, Companion falls
 * back to the standard presentation.
 */
export function useAskInteractionPreferences(shouldLoad = true) {
  const [informationDensity, setInformationDensity] =
    useState<AskInformationDensity>(DEFAULT_DENSITY);
  const [interfaceMethods, setInterfaceMethods] = useState<string[]>([]);
  const [hasExplicitPreferences, setHasExplicitPreferences] = useState(false);

  useEffect(() => {
    if (!shouldLoad) return;

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
          preferences?: {
            informationDensity?: unknown;
            interfaceMethods?: unknown;
          } | null;
        };
        if (!active) return;

        const rawPreferences = body.preferences;
        const nextDensity = parseInformationDensity(
          rawPreferences?.informationDensity,
        );
        const nextInterfaceMethods = parseInterfaceMethods(
          rawPreferences?.interfaceMethods,
        );

        setInformationDensity(nextDensity);
        setInterfaceMethods(nextInterfaceMethods);
        setHasExplicitPreferences(
          Boolean(
            rawPreferences &&
              (isInformationDensity(rawPreferences.informationDensity) ||
                nextInterfaceMethods.length > 0),
          ),
        );
      } catch {
        // Preferences are optional. Standard presentation remains the fallback.
      }
    })();

    return () => {
      active = false;
    };
  }, [shouldLoad]);

  const maxVisibleChoices = useMemo(
    () => choiceLimitForInformationDensity(informationDensity),
    [informationDensity],
  );

  const personaProfile = useMemo(
    () =>
      buildMapAblePersonaProfile({
        informationDensity,
        interfaceMethods,
      }),
    [informationDensity, interfaceMethods],
  );

  const interactionSummary = useMemo(() => {
    if (!hasExplicitPreferences) return null;

    const chosen = [densityLabel(personaProfile.communication.informationDensity)];
    if (personaProfile.communication.interfaceMethods.length > 0) {
      chosen.push(personaProfile.communication.interfaceMethods.join(", "));
    }

    return `Using your chosen interaction preferences: ${chosen.join(
      "; ",
    )}. These are interface preferences only — not a judgement about ability.`;
  }, [hasExplicitPreferences, personaProfile]);

  return {
    informationDensity,
    interfaceMethods,
    maxVisibleChoices,
    personaProfile,
    interactionSummary,
  } as const;
}
