/**
 * @mapable/access-react — accessible list alternative for widget embeds.
 * Partners must render listAlternative alongside any visual summary.
 */

import type { PublicAccessFeatureSummary } from "@mapable/access-types";

export type AccessListAlternativeProps = {
  placeName: string;
  features: PublicAccessFeatureSummary[];
  unknowns: string[];
  heading?: string;
};

/**
 * Returns accessible plain-text lines for screen readers and no-JS fallbacks.
 */
export function buildListAlternativeLines(
  props: AccessListAlternativeProps,
): string[] {
  const lines = [
    props.heading ?? `Access information for ${props.placeName}`,
    ...props.features.map((f) => {
      const state = f.unknown ? "unknown" : f.summary;
      return `${f.type}: ${state}. Source: ${f.source}. Observed: ${f.observedAt ?? "not recorded"}.`;
    }),
  ];
  if (props.unknowns.length) {
    lines.push(`Unknown items: ${props.unknowns.join(", ")}`);
  }
  return lines;
}
