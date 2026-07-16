/**
 * Controlled precinct pilot seed (Wave 1).
 * Synthetic assets only — no public Observatory, no live incidents, no participant journeys.
 */

import { accessPlaceCanonicalRef } from "../canonical-refs";
import { getCivicMode } from "../feature-flags";
import {
  createCivicAssetVersion,
  linkCivicAssetToSource,
  linkCivicExternalReference,
  registerCivicAsset,
} from "../assets/asset-registry-service";
import { getCivicMemoryStore, type StoredCivicAsset } from "../memory-store";
import {
  attachCivicSourceLicence,
  createCivicSourceVersion,
  getCivicSourceByKey,
  registerCivicSource,
} from "../sources/source-registry-service";
import type { CivicAccessibilityClaim, CivicAssetInput } from "../types";

export const PILOT_SOURCE_KEY = "pilot.harbour_precinct.synthetic_v1";

export const PILOT_ASSET_KEYS = {
  interchange: "pilot.transport.harbour_interchange",
  civicBuilding: "pilot.buildings.harbour_civic_centre",
  healthClinic: "pilot.buildings.harbour_health_clinic",
  communityService: "pilot.buildings.harbour_community_hub",
  footpathA: "pilot.pedestrian.harbour_main_path",
  footpathB: "pilot.pedestrian.harbour_side_path",
  curbDropoff: "pilot.curb.harbour_accessible_dropoff",
  curbLoading: "pilot.curb.harbour_passenger_loading",
  publicToilet: "pilot.buildings.harbour_public_toilet",
  changingPlaces: "pilot.buildings.harbour_changing_places",
  westernEntrance: "pilot.buildings.harbour_civic_western_entrance",
  westernLift: "pilot.buildings.harbour_civic_western_lift",
} as const;

const SYNTHETIC_PLACE_IDS = {
  interchange: "harbour-interchange-demo",
  civic: "harbour-civic-centre-demo",
  clinic: "harbour-health-clinic-demo",
  community: "harbour-community-hub-demo",
} as const;

function unknownClaim(
  claimKey: string,
  label: string,
  extras?: Partial<CivicAccessibilityClaim>
): CivicAccessibilityClaim {
  return {
    claimKey,
    label,
    state: "unknown",
    evidenceSummary: null,
    sourceDate: null,
    lastVerified: null,
    notes: "Missing evidence remains unknown.",
    ...extras,
  };
}

async function upsertPilotAsset(
  input: CivicAssetInput
): Promise<StoredCivicAsset> {
  const orgKey = input.organisationId ?? "__platform__";
  const existingId = getCivicMemoryStore().assetsByKey.get(
    `${orgKey}:${input.stableKey}`
  );
  if (existingId) {
    const existing = getCivicMemoryStore().assets.get(existingId);
    if (existing) return existing;
  }
  return registerCivicAsset(input);
}

export async function seedCivicPrecinctPilot(input?: {
  organisationId?: string | null;
}) {
  const organisationId = input?.organisationId ?? null;

  let source = await getCivicSourceByKey(PILOT_SOURCE_KEY);
  if (!source) {
    source = await registerCivicSource({
      stableKey: PILOT_SOURCE_KEY,
      name: "Harbour Precinct synthetic pilot inventory",
      kind: "synthetic_pilot",
      organisationId,
      publisher: "MapAble Civic Pilot",
      homepageUrl: null,
      metadata: { precinct: "harbour", blocking: false },
    });
    await attachCivicSourceLicence(source.id, {
      licenceKind: "internal",
      licenceName: "MapAble internal synthetic pilot licence",
      allowsPublicPublication: false,
      allowsCommercialReuse: false,
      attributionText: "Synthetic Harbour Precinct — not for public publication",
      notes: "Demo/shadow only. Not real government open data.",
    });
    await createCivicSourceVersion(source.id, {
      versionLabel: "pilot-1",
      retrievedAt: new Date("2026-07-16T00:00:00.000Z"),
      publishedAt: new Date("2026-07-16T00:00:00.000Z"),
      notes: "Wave 1 precinct inventory",
    });
  }

  const interchange = await upsertPilotAsset({
    stableKey: PILOT_ASSET_KEYS.interchange,
    organisationId,
    accessPlaceId: SYNTHETIC_PLACE_IDS.interchange,
    assetClass: "transport",
    assetType: "interchange",
    title: "Harbour Interchange (synthetic)",
    plainLanguageTitle: "Harbour transport interchange",
    jurisdictionCode: "AU-NSW-DEMO",
    visibility: "internal",
    geometry: {
      type: "Point",
      coordinates: [151.21, -33.86],
      note: "Imported geometry does not prove accessibility.",
    },
    accessibilityClaims: [
      unknownClaim("step_free_entry", "Step-free entry"),
      unknownClaim("lift_access", "Lift access to platforms"),
      {
        claimKey: "public_transport_nearby",
        label: "Public transport services",
        state: "asserted",
        sourceDate: "2026-07-16",
        notes: "Service presence asserted; pathway quality unknown.",
      },
    ],
    attribution: "Synthetic Harbour Precinct",
  });

  const civicBuilding = await upsertPilotAsset({
    stableKey: PILOT_ASSET_KEYS.civicBuilding,
    organisationId,
    accessPlaceId: SYNTHETIC_PLACE_IDS.civic,
    assetClass: "buildings_services",
    assetType: "council_office",
    title: "Harbour Civic Centre (synthetic)",
    plainLanguageTitle: "Harbour Civic Centre",
    jurisdictionCode: "AU-NSW-DEMO",
    visibility: "internal",
    geometry: { type: "Point", coordinates: [151.211, -33.861] },
    accessibilityClaims: [
      {
        claimKey: "step_free_entry",
        label: "Step-free western entrance",
        state: "evidenced",
        sourceDate: "2026-06-01",
        lastVerified: "2026-06-01",
        evidenceSummary: "Assessor photo of western entrance (synthetic).",
      },
      {
        claimKey: "accessible_toilet",
        label: "Accessible toilet on ground floor",
        state: "stale",
        sourceDate: "2024-01-10",
        lastVerified: "2024-01-10",
        notes: "Stale evidence remains stale.",
      },
      unknownClaim("hearing_loop", "Hearing loop at service counter"),
    ],
    lastVerifiedAt: new Date("2026-06-01T00:00:00.000Z"),
    nextReviewAt: new Date("2026-12-01T00:00:00.000Z"),
  });

  const clinic = await upsertPilotAsset({
    stableKey: PILOT_ASSET_KEYS.healthClinic,
    organisationId,
    accessPlaceId: SYNTHETIC_PLACE_IDS.clinic,
    assetClass: "buildings_services",
    assetType: "clinic",
    title: "Harbour Health Clinic (synthetic)",
    plainLanguageTitle: "Harbour Health Clinic",
    jurisdictionCode: "AU-NSW-DEMO",
    accessibilityClaims: [
      unknownClaim("step_free_entry", "Step-free entry"),
      unknownClaim("accessible_parking", "Accessible parking"),
    ],
  });

  const community = await upsertPilotAsset({
    stableKey: PILOT_ASSET_KEYS.communityService,
    organisationId,
    accessPlaceId: SYNTHETIC_PLACE_IDS.community,
    assetClass: "buildings_services",
    assetType: "community_centre",
    title: "Harbour Community Hub (synthetic)",
    plainLanguageTitle: "Harbour Community Hub",
    jurisdictionCode: "AU-NSW-DEMO",
    accessibilityClaims: [
      unknownClaim("quiet_space", "Quiet space"),
      unknownClaim("assistance_animals_welcome", "Assistance animals welcome"),
    ],
  });

  const pathA = await upsertPilotAsset({
    stableKey: PILOT_ASSET_KEYS.footpathA,
    organisationId,
    assetClass: "pedestrian_realm",
    assetType: "footpath",
    title: "Harbour Main Path (synthetic)",
    plainLanguageTitle: "Main path from interchange to civic centre",
    jurisdictionCode: "AU-NSW-DEMO",
    geometry: {
      type: "LineString",
      coordinates: [
        [151.21, -33.86],
        [151.211, -33.861],
      ],
    },
    accessibilityClaims: [
      unknownClaim("width", "Path width"),
      unknownClaim("gradient", "Gradient"),
      unknownClaim("surface", "Surface quality"),
    ],
  });

  const pathB = await upsertPilotAsset({
    stableKey: PILOT_ASSET_KEYS.footpathB,
    organisationId,
    assetClass: "pedestrian_realm",
    assetType: "footpath",
    title: "Harbour Side Path (synthetic)",
    plainLanguageTitle: "Side path via clinic",
    jurisdictionCode: "AU-NSW-DEMO",
    accessibilityClaims: [unknownClaim("lighting", "Lighting")],
  });

  const curbDropoff = await upsertPilotAsset({
    stableKey: PILOT_ASSET_KEYS.curbDropoff,
    organisationId,
    assetClass: "curb_parking",
    assetType: "drop_off",
    title: "Harbour accessible drop-off (synthetic)",
    plainLanguageTitle: "Accessible drop-off bay",
    jurisdictionCode: "AU-NSW-DEMO",
    accessibilityClaims: [
      unknownClaim("kerb_ramp", "Kerb ramp clearance"),
      unknownClaim("unloading_side", "Unloading side"),
    ],
  });

  const curbLoading = await upsertPilotAsset({
    stableKey: PILOT_ASSET_KEYS.curbLoading,
    organisationId,
    assetClass: "curb_parking",
    assetType: "passenger_loading_zone",
    title: "Harbour passenger loading zone (synthetic)",
    plainLanguageTitle: "Passenger loading zone",
    jurisdictionCode: "AU-NSW-DEMO",
    accessibilityClaims: [unknownClaim("hours", "Operating hours")],
  });

  const toilet = await upsertPilotAsset({
    stableKey: PILOT_ASSET_KEYS.publicToilet,
    organisationId,
    assetClass: "buildings_services",
    assetType: "public_toilet",
    title: "Harbour public toilet (synthetic)",
    plainLanguageTitle: "Public accessible toilet",
    jurisdictionCode: "AU-NSW-DEMO",
    accessibilityClaims: [
      {
        claimKey: "accessible_toilet",
        label: "Accessible toilet available",
        state: "disputed",
        sourceDate: "2026-05-01",
        notes: "Conflicting community and venue reports — remains disputed.",
      },
    ],
  });

  const changingPlaces = await upsertPilotAsset({
    stableKey: PILOT_ASSET_KEYS.changingPlaces,
    organisationId,
    assetClass: "buildings_services",
    assetType: "changing_places",
    title: "Harbour Changing Places (synthetic)",
    plainLanguageTitle: "Changing Places facility",
    jurisdictionCode: "AU-NSW-DEMO",
    accessibilityClaims: [
      unknownClaim("changing_places", "Changing Places facility present"),
    ],
  });

  const entrance = await upsertPilotAsset({
    stableKey: PILOT_ASSET_KEYS.westernEntrance,
    organisationId,
    accessPlaceId: SYNTHETIC_PLACE_IDS.civic,
    assetClass: "buildings_services",
    assetType: "entrance",
    title: "Harbour Civic western entrance (synthetic)",
    plainLanguageTitle: "Western entrance",
    jurisdictionCode: "AU-NSW-DEMO",
    accessibilityClaims: [
      {
        claimKey: "step_free_entry",
        label: "Step-free",
        state: "evidenced",
        sourceDate: "2026-06-01",
        lastVerified: "2026-06-01",
      },
      unknownClaim("intercom", "Intercom / after-hours access"),
    ],
  });

  const lift = await upsertPilotAsset({
    stableKey: PILOT_ASSET_KEYS.westernLift,
    organisationId,
    accessPlaceId: SYNTHETIC_PLACE_IDS.civic,
    assetClass: "buildings_services",
    assetType: "lift",
    title: "Harbour Civic western lift (synthetic)",
    plainLanguageTitle: "Western lift",
    jurisdictionCode: "AU-NSW-DEMO",
    accessibilityClaims: [
      {
        claimKey: "lift_access",
        label: "Lift operational status",
        state: "unknown",
        notes: "No live incident feed in Wave 1 — status remains unknown.",
      },
    ],
  });

  const assets = [
    interchange,
    civicBuilding,
    clinic,
    community,
    pathA,
    pathB,
    curbDropoff,
    curbLoading,
    toilet,
    changingPlaces,
    entrance,
    lift,
  ];

  for (const asset of assets) {
    if (asset.versions.length === 0) {
      await createCivicAssetVersion(asset.id, {
        versionLabel: "pilot-1",
        changelog: "Harbour precinct Wave 1 seed",
      });
    }
    if (!asset.sourceId) {
      await linkCivicAssetToSource(asset.id, source.id);
    }
    if (
      asset.accessPlaceId &&
      !asset.externalReferences.some((r) => r.system === "access_place")
    ) {
      await linkCivicExternalReference(asset.id, {
        system: "access_place",
        externalId: asset.accessPlaceId,
        canonicalRef: accessPlaceCanonicalRef(asset.accessPlaceId),
      });
    }
  }

  return {
    mode: getCivicMode(),
    blocking: false as const,
    publicObservatory: false as const,
    liveIncidents: false as const,
    simulation: false as const,
    participantJourneyAccess: false as const,
    source: {
      id: source.id,
      stableKey: source.stableKey,
      licenceCount: source.licences.length,
    },
    assetCount: assets.length,
    assets: {
      interchange,
      civicBuilding,
      clinic,
      community,
      pathA,
      pathB,
      curbDropoff,
      curbLoading,
      toilet,
      changingPlaces,
      entrance,
      lift,
    },
    syntheticAccessPlaceIds: SYNTHETIC_PLACE_IDS,
  };
}
