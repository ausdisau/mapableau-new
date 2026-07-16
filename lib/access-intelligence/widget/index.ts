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

export function assertSdkApiEnabled(): void {
  if (!accessIntelligenceFlags.sdkApi) {
    throw new Error(
      "Access SDK API disabled. Set ACCESS_INTELLIGENCE_SDK_API=true.",
    );
  }
}

export type SdkCertificationCase = {
  code: string;
  description: string;
  passed: boolean;
};

/** Sandbox certification suite — partner embeds must keep list alternatives. */
export function runSdkCertificationSuite(input: {
  hasListAlternative: boolean;
  passportExposedByDefault: boolean;
  subscriptionBiasesConfidence: boolean;
  originAllowlisted: boolean;
}): { passed: boolean; cases: SdkCertificationCase[] } {
  const cases: SdkCertificationCase[] = [
    {
      code: "list_alternative",
      description: "Widget payload includes accessible list alternative",
      passed: input.hasListAlternative,
    },
    {
      code: "passport_default_deny",
      description: "Passport fields are not exposed by default on public widget",
      passed: !input.passportExposedByDefault,
    },
    {
      code: "no_plan_bias",
      description: "Subscription plan must not bias confidence or evidence",
      passed: !input.subscriptionBiasesConfidence,
    },
    {
      code: "origin_allowlist",
      description: "Embed origin allowlist enforced",
      passed: input.originAllowlisted,
    },
  ];
  return { passed: cases.every((c) => c.passed), cases };
}
