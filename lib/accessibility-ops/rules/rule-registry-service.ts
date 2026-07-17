import {
  isAccessibilityOpsFlagEnabled,
  useAccessibilityOpsMemoryStore,
} from "../feature-flags";
import {
  memoryAddApplicability,
  memoryCreateRule,
  memoryGetRule,
  memoryListRules,
  memoryUpsertStandard,
  type StoredRule,
} from "../memory-store";
import type {
  AccessibilityAssetClass,
  AccessibilityAssetType,
  AccessibilityRuleInput,
  AccessibilityRuleVersionInput,
} from "../types";

function assertRegistryEnabled(): void {
  if (
    !isAccessibilityOpsFlagEnabled("opsEnabled") ||
    !isAccessibilityOpsFlagEnabled("ruleRegistry")
  ) {
    throw new Error("ACCESSIBILITY_OPS_DISABLED");
  }
}

export async function registerAccessibilityRule(
  input: AccessibilityRuleInput,
  version: AccessibilityRuleVersionInput,
  applicability?: Array<{
    assetClass?: AccessibilityAssetClass | null;
    assetType?: AccessibilityAssetType | null;
    notes?: string;
  }>
): Promise<StoredRule> {
  assertRegistryEnabled();
  void useAccessibilityOpsMemoryStore();

  const standard = memoryUpsertStandard({
    organisation: input.sourceOrganisation,
    title: input.sourceTitle,
    version: input.sourceVersion,
    status: input.sourceStatus,
    retrievalDate: new Date().toISOString().slice(0, 10),
  });

  const rule = memoryCreateRule(input, standard.id, version);
  for (const a of applicability ?? []) {
    memoryAddApplicability(
      rule.id,
      a.assetClass ?? null,
      a.assetType ?? null,
      a.notes
    );
  }
  return rule;
}

export async function listAccessibilityRules(): Promise<StoredRule[]> {
  assertRegistryEnabled();
  return memoryListRules();
}

export async function getAccessibilityRule(
  ruleId: string
): Promise<StoredRule | null> {
  assertRegistryEnabled();
  return memoryGetRule(ruleId);
}

export function serializeRule(rule: StoredRule) {
  return {
    id: rule.id,
    stableKey: rule.stableKey,
    title: rule.title,
    plainLanguageTitle: rule.plainLanguageTitle,
    description: rule.description,
    profile: rule.profile,
    automation: rule.automation,
    standardSourceId: rule.standardSourceId,
    requirementRefs: rule.requirementRefs,
    internalInterpretation: rule.internalInterpretation,
    severityDefault: rule.severityDefault,
    ownerUserId: rule.ownerUserId,
    knownLimitations: rule.knownLimitations,
    evidenceRequirements: rule.evidenceRequirements,
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
    versions: rule.versions.map((v) => ({
      id: v.id,
      versionLabel: v.versionLabel,
      expectation: v.expectation,
      assumptions: v.assumptions,
      inputRequirements: v.inputRequirements,
      effectiveFrom: v.effectiveFrom.toISOString(),
      reviewBy: v.reviewBy?.toISOString() ?? null,
      supersededByRuleVersionId: v.supersededByRuleVersionId,
    })),
    applicability: rule.applicability.map((a) => ({
      id: a.id,
      assetClass: a.assetClass,
      assetType: a.assetType,
      notes: a.notes,
    })),
  };
}

/** Seed baseline MapAble-internal + WCAG-mapped shadow rules (idempotent). */
export async function ensureBaselineAccessibilityRules(): Promise<void> {
  assertRegistryEnabled();
  const existing = memoryListRules();
  if (existing.some((r) => r.stableKey === "mapable.ds.visible_focus")) {
    return;
  }

  await registerAccessibilityRule(
    {
      stableKey: "mapable.ds.visible_focus",
      title: "Visible focus indicator",
      plainLanguageTitle: "Keyboard focus must be easy to see",
      description:
        "Interactive controls must show a visible focus indicator. Automated pass does not prove usable keyboard access.",
      profile: "design_system",
      automation: "semi_automated",
      sourceOrganisation: "W3C",
      sourceTitle: "WCAG 2.2",
      sourceVersion: "2.2",
      sourceStatus: "voluntary_standard",
      requirementRefs: ["2.4.7", "2.4.11"],
      severityDefault: "major",
      knownLimitations:
        "Automated contrast/focus heuristics can miss custom focus styles.",
      evidenceRequirements: "Screenshot or keyboard trace with focus ring visible.",
    },
    {
      versionLabel: "1.0.0",
      expectation: "Focused controls have a non-colour-only visible indicator.",
      assumptions: "Applies to MapAble web components and routes.",
    },
    [
      { assetClass: "digital", assetType: "component" },
      { assetClass: "digital", assetType: "design_system_component" },
      { assetClass: "digital", assetType: "route" },
      { assetClass: "digital", assetType: "page" },
    ]
  );

  await registerAccessibilityRule(
    {
      stableKey: "mapable.ds.refusal_discoverable",
      title: "Decline / refusal control discoverable",
      plainLanguageTitle: "People must be able to find the decline or refuse action",
      description:
        "Where consent or AURA proposals can be declined, the decline control must be discoverable by keyboard and screen reader.",
      profile: "mapable_internal",
      automation: "manual",
      sourceOrganisation: "MapAble",
      sourceTitle: "MapAble internal accessibility rule",
      sourceVersion: "2026-07-16",
      sourceStatus: "mapable_internal",
      requirementRefs: ["refusal_path"],
      severityDefault: "critical",
      knownLimitations: "Requires human or lived-experience review for dignity.",
    },
    {
      versionLabel: "1.0.0",
      expectation: "Decline/refuse control is present, labelled, and keyboard reachable.",
    },
    [
      { assetClass: "digital", assetType: "component" },
      { assetClass: "digital", assetType: "user_flow" },
      { assetClass: "digital", assetType: "form" },
    ]
  );

  await registerAccessibilityRule(
    {
      stableKey: "mapable.doc.pdf_structure",
      title: "PDF heading structure and reading order",
      plainLanguageTitle: "Generated PDFs must keep headings and reading order",
      description:
        "Tagged PDF structure must preserve headings and reading order. An HTML alternative does not eliminate a PDF barrier.",
      profile: "document",
      automation: "automated",
      sourceOrganisation: "PDF Association / ISO",
      sourceTitle: "PDF/UA techniques",
      sourceVersion: "current",
      sourceStatus: "voluntary_standard",
      severityDefault: "major",
      knownLimitations: "Structure checks do not prove comprehension.",
    },
    {
      versionLabel: "1.0.0",
      expectation: "PDF contains heading tags and a coherent reading order.",
    },
    [
      { assetClass: "digital", assetType: "pdf" },
      { assetClass: "digital", assetType: "generated_document" },
    ]
  );

  await registerAccessibilityRule(
    {
      stableKey: "mapable.built.evidence_freshness",
      title: "Built-environment evidence freshness",
      plainLanguageTitle: "Access evidence must not be silently stale",
      description:
        "When evidence for a lift, entrance, or toilet exceeds freshness policy, state becomes unknown — not absent.",
      profile: "built_environment",
      automation: "semi_automated",
      sourceOrganisation: "MapAble",
      sourceTitle: "Access Intelligence data reliability policy",
      sourceVersion: "compose-when-merged",
      sourceStatus: "mapable_internal",
      severityDefault: "moderate",
    },
    {
      versionLabel: "1.0.0",
      expectation: "Stale evidence yields unknown, with prior guide preserved.",
    },
    [
      { assetClass: "built", assetType: "lift" },
      { assetClass: "built", assetType: "entrance" },
      { assetClass: "built", assetType: "place" },
      { assetClass: "built", assetType: "floor_plan" },
    ]
  );

  await registerAccessibilityRule(
    {
      stableKey: "mapable.service.accessible_channel",
      title: "Accessible service channel for cancellation",
      plainLanguageTitle: "Cancellation must work in the participant’s communication mode",
      description:
        "Service workflow changes that require a single inaccessible channel (e.g. voice-only) create a barrier when no accessible alternative exists.",
      profile: "service_workflow",
      automation: "manual",
      sourceOrganisation: "MapAble",
      sourceTitle: "Service workflow accessibility",
      sourceVersion: "2026-07-16",
      sourceStatus: "mapable_internal",
      severityDefault: "major",
    },
    {
      versionLabel: "1.0.0",
      expectation:
        "Cancellation/adjustment flows offer an accessible channel matching selected communication preferences.",
    },
    [
      { assetClass: "service", assetType: "transport_request_workflow" },
      { assetClass: "service", assetType: "booking_workflow" },
      { assetClass: "service", assetType: "complaint_workflow" },
    ]
  );
}
