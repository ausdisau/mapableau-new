/**
 * Controlled shadow pilot seed (Wave 0/1).
 * Synthetic assets only — no production release blocking.
 */

import {
  createAccessibilityAssetVersion,
  linkAccessibilityAssetDependency,
  registerAccessibilityAsset,
} from "../assets/asset-registry-service";
import { accessPlaceCanonicalRef } from "../compose/access-intelligence-adapter";
import { getMemoryStore, type StoredAsset } from "../memory-store";
import { ensureBaselineAccessibilityRules } from "../rules/rule-registry-service";
import { evaluateShadowRules } from "../shadow/evaluate";
import type { AccessibilityAssetInput } from "../types";

export const PILOT_ASSET_KEYS = {
  auraMissionUi: "pilot.digital.aura_mission_ui",
  designSystemButton: "pilot.digital.ds_button",
  offlineVisitPack: "pilot.digital.offline_visit_pack",
  harbourCivic: "pilot.built.harbour_civic_centre",
  harbourLift: "pilot.built.harbour_western_lift",
  venueVerification: "pilot.service.venue_verification",
  transportRequest: "pilot.service.accessible_transport_request",
  accessWidget: "pilot.integration.access_summary_widget",
} as const;

async function upsertPilotAsset(
  input: AccessibilityAssetInput
): Promise<StoredAsset> {
  const orgKey = input.organisationId ?? "__platform__";
  const existingId = getMemoryStore().assetsByKey.get(
    `${orgKey}:${input.stableKey}`
  );
  if (existingId) {
    const existing = getMemoryStore().assets.get(existingId);
    if (existing) return existing;
  }
  return registerAccessibilityAsset(input);
}

export async function seedAccessibilityOpsPilot(input?: {
  ownerUserId?: string | null;
  organisationId?: string | null;
}) {
  await ensureBaselineAccessibilityRules();

  const ownerUserId = input?.ownerUserId ?? null;
  const organisationId = input?.organisationId ?? null;

  const button = await upsertPilotAsset({
    stableKey: PILOT_ASSET_KEYS.designSystemButton,
    organisationId,
    ownerUserId,
    assetClass: "digital",
    assetType: "design_system_component",
    title: "MapAble Button (design system)",
    plainLanguageTitle: "Shared button component",
    criticality: "important",
    purposeTags: ["design_system"],
    sourceSystem: "mapable-design-system",
    deploymentEnvironment: "demo",
    canonicalDomainRef: "component:MapAbleButton",
  });
  if (button.versions.length === 0) {
    await createAccessibilityAssetVersion(button.id, {
      versionLabel: "pilot-1",
      changelog: "Pilot seed version",
    });
  }

  const auraUi = await upsertPilotAsset({
    stableKey: PILOT_ASSET_KEYS.auraMissionUi,
    organisationId,
    ownerUserId,
    assetClass: "digital",
    assetType: "component",
    title: "AURA proposal / accessibility mission UI",
    plainLanguageTitle: "Screen where people approve or decline AURA proposals",
    criticality: "safety_critical",
    purposeTags: ["stop_aura", "refusal_path", "consent"],
    sourceSystem: "mapable-aura",
    deploymentEnvironment: "demo",
    canonicalDomainRef: "route:/ask",
  });
  if (auraUi.versions.length === 0) {
    await createAccessibilityAssetVersion(auraUi.id, {
      versionLabel: "pilot-1",
    });
  }
  if (!auraUi.dependencies.some((d) => d.dependsOnAssetId === button.id)) {
    await linkAccessibilityAssetDependency(
      auraUi.id,
      button.id,
      "uses_component"
    );
  }

  const visitPack = await upsertPilotAsset({
    stableKey: PILOT_ASSET_KEYS.offlineVisitPack,
    organisationId,
    ownerUserId,
    assetClass: "digital",
    assetType: "generated_document",
    title: "Offline Visit Pack PDF",
    plainLanguageTitle: "Downloadable visit pack for low connectivity",
    criticality: "essential",
    purposeTags: ["visit_plan"],
    sourceSystem: "mapable-documents",
    deploymentEnvironment: "demo",
    canonicalDomainRef: "document:offline-visit-pack",
  });
  if (visitPack.versions.length === 0) {
    await createAccessibilityAssetVersion(visitPack.id, {
      versionLabel: "pilot-1",
    });
  }

  const harbour = await upsertPilotAsset({
    stableKey: PILOT_ASSET_KEYS.harbourCivic,
    organisationId,
    ownerUserId,
    assetClass: "built",
    assetType: "place",
    title: "Harbour Civic Centre (synthetic pilot venue)",
    plainLanguageTitle: "Harbour Civic Centre pilot place",
    criticality: "essential",
    purposeTags: ["interview_mission"],
    sourceSystem: "access-place",
    deploymentEnvironment: "demo",
    // Synthetic place id until AccessPlace row exists in pilot org
    canonicalDomainRef: accessPlaceCanonicalRef("harbour-civic-centre-demo"),
  });
  if (harbour.versions.length === 0) {
    await createAccessibilityAssetVersion(harbour.id, {
      versionLabel: "pilot-1",
    });
  }

  const lift = await upsertPilotAsset({
    stableKey: PILOT_ASSET_KEYS.harbourLift,
    organisationId,
    ownerUserId,
    assetClass: "built",
    assetType: "lift",
    title: "Harbour Civic Centre western lift",
    plainLanguageTitle: "Western lift",
    criticality: "safety_critical",
    purposeTags: ["accessible_entrance_status"],
    sourceSystem: "indoor-accessibility",
    deploymentEnvironment: "demo",
    canonicalDomainRef: "building_element:harbour-western-lift",
  });
  if (lift.versions.length === 0) {
    await createAccessibilityAssetVersion(lift.id, {
      versionLabel: "pilot-1",
    });
  }
  if (!harbour.dependencies.some((d) => d.dependsOnAssetId === lift.id)) {
    await linkAccessibilityAssetDependency(harbour.id, lift.id, "contains");
  }

  const venueVerification = await upsertPilotAsset({
    stableKey: PILOT_ASSET_KEYS.venueVerification,
    organisationId,
    ownerUserId,
    assetClass: "service",
    assetType: "booking_workflow",
    title: "Venue verification workflow",
    plainLanguageTitle: "How venues verify accessibility claims",
    criticality: "important",
    sourceSystem: "access-accreditation",
    deploymentEnvironment: "demo",
  });

  const transport = await upsertPilotAsset({
    stableKey: PILOT_ASSET_KEYS.transportRequest,
    organisationId,
    ownerUserId,
    assetClass: "service",
    assetType: "transport_request_workflow",
    title: "Accessible transport request / cancellation",
    plainLanguageTitle: "Ask for or cancel an accessible ride",
    criticality: "essential",
    purposeTags: ["booking"],
    sourceSystem: "mapable-transport",
    deploymentEnvironment: "demo",
  });

  const widget = await upsertPilotAsset({
    stableKey: PILOT_ASSET_KEYS.accessWidget,
    organisationId,
    ownerUserId,
    assetClass: "integration",
    assetType: "partner_widget",
    title: "Embedded access-summary widget",
    plainLanguageTitle: "Partner access summary embed",
    criticality: "important",
    sourceSystem: "partner-api",
    deploymentEnvironment: "demo",
    canonicalDomainRef: "widget:access-summary",
  });

  const evaluations = [];
  for (const asset of [auraUi, visitPack, harbour, transport, widget]) {
    evaluations.push(
      evaluateShadowRules({
        assetId: asset.id,
        assetVersionId: asset.versions[0]?.id,
        correlationId: `pilot-${asset.stableKey}`,
      })
    );
  }

  return {
    assets: {
      button,
      auraUi,
      visitPack,
      harbour,
      lift,
      venueVerification,
      transport,
      widget,
    },
    evaluations,
    mode: "shadow" as const,
    blocking: false as const,
  };
}
