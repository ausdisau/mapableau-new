import { createDemoPassports } from "../demo-data";
import { calculatePersonalFit } from "../fit-engine";
import type { AccessPassport, AccessRequirement, AccessDecision } from "../schemas";

import { applyMutation } from "./counterfactual";
import { buildHarbourLivingTwin } from "./harbour-civic";
import type { LivingAccessTwin, VenueMutation } from "./schemas";
import { getAccessStateAt } from "./temporal";

function req(
  id: string,
  featureType: AccessRequirement["featureType"],
  importance: AccessRequirement["importance"],
  operator: AccessRequirement["operator"],
  value: AccessRequirement["value"],
  unit?: string,
): AccessRequirement {
  return { id, featureType, importance, operator, value, unit, shareWithVenue: false };
}

/**
 * Transparent library of synthetic Access Passports for Access Coverage.
 * Labeled synthetic — not population prevalence.
 */
export function createSyntheticCoveragePassports(): AccessPassport[] {
  const userId = "synthetic-coverage-library";
  const now = new Date().toISOString();
  const base = (name: string, requirements: AccessRequirement[]): AccessPassport => ({
    id: `synth-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    userId,
    name: `[Synthetic] ${name}`,
    requirements,
    communicationPreferences: ["plain_language"],
    mobilityAids: [],
    sharingDefaults: {
      shareRequiredWithVenue: false,
      sharePreferredWithVenue: false,
      shareHelpfulWithVenue: false,
    },
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  });

  return [
    base("Step-free route", [req("s1", "step_free", "required", "available", true)]),
    base("Power-chair dimensions", [
      req("s2a", "step_free", "required", "available", true),
      req("s2b", "clear_door_width_mm", "required", "minimum", 850, "mm"),
      req("s2c", "lift", "required", "available", true),
    ]),
    base("Low walking endurance", [
      req("s3a", "step_free", "required", "available", true),
      req("s3b", "lift", "required", "available", true),
      req("s3c", "seating_interval_m", "preferred", "maximum", 30, "m"),
    ]),
    base("Seating needs", [req("s4", "seating_interval_m", "required", "maximum", 25, "m")]),
    base("Low sensory load", [
      req("s5a", "quiet_waiting_area", "required", "available", true),
      req("s5b", "low_glare_lighting", "preferred", "available", true),
    ]),
    base("Quiet waiting", [req("s6", "quiet_waiting_area", "required", "available", true)]),
    base("Tactile wayfinding", [req("s7", "tactile_wayfinding", "required", "available", true)]),
    base("Audible lift information", [
      req("s8a", "lift", "required", "available", true),
      req("s8b", "audio_wayfinding", "required", "available", true),
    ]),
    base("Hearing augmentation", [
      req("s9", "hearing_augmentation", "required", "available", true),
    ]),
    base("Assistance animal access", [
      req("s10", "assistance_animal_access", "required", "available", true),
    ]),
    base("Accessible toilet", [
      req("s11", "accessible_toilet", "required", "available", true),
    ]),
    base("Changing Places requirement", [
      req("s12", "changing_places", "required", "available", true),
    ]),
    base("Staff assistance", [req("s13", "staff_assistance", "required", "available", true)]),
    base("Plain-language information", [
      req("s14", "plain_language_instructions", "required", "available", true),
    ]),
    base("Combined power-chair + toilet", [
      req("s15a", "step_free", "required", "available", true),
      req("s15b", "lift", "required", "available", true),
      req("s15c", "clear_door_width_mm", "required", "minimum", 850, "mm"),
      req("s15d", "accessible_toilet", "required", "available", true),
    ]),
    base("Combined sensory + staff", [
      req("s16a", "quiet_waiting_area", "required", "available", true),
      req("s16b", "staff_assistance", "preferred", "available", true),
      req("s16c", "plain_language_instructions", "preferred", "available", true),
    ]),
    // Extra combinations to exceed 16
    base("Corridor width 1200 mm", [
      req("s17a", "step_free", "required", "available", true),
      req("s17b", "corridor_width_mm", "required", "minimum", 1200, "mm"),
    ]),
    base("Demo template power chair", createDemoPassports()[0]!.requirements),
  ];
}

export type AccessCoverageResult = {
  testedProfileCount: number;
  suitable: number;
  suitableWithConditions: number;
  blocked: number;
  unknown: number;
  results: {
    syntheticProfileId: string;
    profileName: string;
    decision: AccessDecision;
    syntheticLabel: true;
  }[];
  topBlockers: { featureType: string; affectedProfiles: number }[];
  topUnknowns: { featureType: string; affectedProfiles: number }[];
  note: string;
};

function tallyFindings(
  results: AccessCoverageResult["results"],
  kind: "blockers" | "unknowns",
): { featureType: string; affectedProfiles: number }[] {
  const counts = new Map<string, number>();
  for (const row of results) {
    const items = kind === "blockers" ? row.decision.blockers : row.decision.unknowns;
    const keys = new Set(
      items.map((text) => {
        const match = text.match(/\b([a-z_]+)\b/);
        return match?.[1] ?? text.slice(0, 40);
      }),
    );
    for (const key of keys) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([featureType, affectedProfiles]) => ({ featureType, affectedProfiles }))
    .sort((a, b) => b.affectedProfiles - a.affectedProfiles)
    .slice(0, 8);
}

export function calculateAccessCoverage(input?: {
  twin?: LivingAccessTwin;
  visitAt?: string;
  mutation?: VenueMutation;
}): AccessCoverageResult {
  const base = input?.twin ?? buildHarbourLivingTwin();
  const twin = input?.mutation ? applyMutation(base, input.mutation) : base;
  const visitAt = input?.visitAt ?? "2026-07-16T00:00:00.000Z"; // 10:00 Sydney approx
  const state = getAccessStateAt(twin, visitAt);
  const passports = createSyntheticCoveragePassports();

  const results = passports.map((passport) => {
    const decision = calculatePersonalFit({
      place: twin.place,
      passport,
      features: state.effectiveFeatures,
      evidence: twin.evidence,
      incidents: state.activeIncidents,
      now: new Date(visitAt),
    });
    return {
      syntheticProfileId: passport.id,
      profileName: passport.name,
      decision,
      syntheticLabel: true as const,
    };
  });

  return {
    testedProfileCount: results.length,
    suitable: results.filter((r) => r.decision.status === "suitable").length,
    suitableWithConditions: results.filter(
      (r) => r.decision.status === "suitable_with_conditions",
    ).length,
    blocked: results.filter((r) => r.decision.status === "blocked").length,
    unknown: results.filter((r) => r.decision.status === "unknown").length,
    results,
    topBlockers: tallyFindings(results, "blockers"),
    topUnknowns: tallyFindings(results, "unknowns"),
    note: "Access Coverage tests the environment against synthetic profiles. These are not population prevalence estimates and do not rank people.",
  };
}
