/**
 * System 6 — Widget payload builder (secure embed summary).
 * Venue config and subscription status cannot modify verified evidence/confidence.
 */

import { accessIntelligenceFlags } from "@/lib/access-intelligence/feature-flags";

export type WidgetMode =
  | "quick_access_summary"
  | "current_incident_banner"
  | "entrance_selector"
  | "access_guide_launcher"
  | "personal_fit_checker"
  | "visit_plan_launcher"
  | "accessibility_feedback_link";

export type WidgetPublicPayload = {
  accessPlaceId: string;
  placeName: string;
  features: Array<{
    type: string;
    summary: string;
    source: string;
    observedAt: string | null;
    confidenceLabel: string;
    unknown: boolean;
  }>;
  incidents: Array<{ id: string; summary: string; severity: string }>;
  unknowns: string[];
  listAlternative: Array<{ label: string; href?: string }>;
  passportExposed: false;
};

export function buildWidgetPayload(input: {
  accessPlaceId: string;
  placeName: string;
  features: WidgetPublicPayload["features"];
  incidents: WidgetPublicPayload["incidents"];
  /** Ignored for confidence — paid plans must not bias output. */
  subscriptionPlan?: string;
}): WidgetPublicPayload {
  void input.subscriptionPlan;
  const unknowns = input.features.filter((f) => f.unknown).map((f) => f.type);
  return {
    accessPlaceId: input.accessPlaceId,
    placeName: input.placeName,
    features: input.features,
    incidents: input.incidents,
    unknowns,
    listAlternative: [
      { label: `Access details for ${input.placeName}`, href: `/access/places/${input.accessPlaceId}` },
      ...input.features.map((f) => ({
        label: `${f.type}: ${f.unknown ? "unknown" : f.summary} (${f.source}, ${f.observedAt ?? "no date"})`,
      })),
    ],
    passportExposed: false,
  };
}

export function assertWidgetEnabled(): void {
  if (!accessIntelligenceFlags.widget) {
    throw new Error("Access widget disabled.");
  }
}
