import { describe, expect, it } from "vitest";

import {
  classifyObservationChange,
  evaluateOperationalIngestion,
  getDataSource,
  validateProvenanceEnvelope,
} from "@/lib/access/data-sources";

describe("Access data-source admission", () => {
  it("keeps controlled research microdata outside operational ingestion", () => {
    const plida = getDataSource("abs-plida");

    const decision = evaluateOperationalIngestion(plida);

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/controlled research/i);
  });

  it("admits AHRC published rights statistics only with recorded licence metadata", () => {
    const ahrc = getDataSource("ahrc-disability-rights-statistics");

    expect(ahrc.licence?.id).toBe("CC-BY-4.0");
    expect(evaluateOperationalIngestion(ahrc).allowed).toBe(true);
  });

  it("requires dataset-level reuse terms before portal-level sources can ingest", () => {
    const tfnsw = getDataSource("transport-for-nsw-open-data");

    const decision = evaluateOperationalIngestion(tfnsw);

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/dataset-level licence/i);
  });

  it("does not treat participant-controlled information as a bulk external dataset", () => {
    const decision = evaluateOperationalIngestion({
      id: "participant-access-profile",
      label: "Participant access profile",
      steward: "MapAble participant",
      sourceUri: null,
      dataClass: "PARTICIPANT_CONTROLLED",
      accessMode: "PARTICIPANT_CONSENT",
      operationalImport: false,
      requiresDatasetLevelLicence: false,
      licence: null,
      allowedUses: ["purpose_bound_personalisation"],
      prohibitedUses: ["bulk_external_ingestion"],
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/participant-controlled/i);
  });
});

describe("Access provenance admission", () => {
  it("bounds confidence and prevents machine evidence from self-verifying", () => {
    expect(() =>
      validateProvenanceEnvelope({
        dataSourceId: "openstreetmap",
        sourceRecordId: "way/1",
        sourceUri: "https://www.openstreetmap.org/way/1",
        retrievedAt: "2026-09-10T00:00:00.000Z",
        contentHash: "sha256:abc",
        licenceId: "ODbL-1.0",
        attributionText: "© OpenStreetMap contributors",
        verificationStatus: "OBSERVED",
        confidence: 1.2,
        machineDerived: false,
      }),
    ).toThrow(/confidence/i);

    expect(() =>
      validateProvenanceEnvelope({
        dataSourceId: "openstreetmap",
        sourceRecordId: "way/1",
        sourceUri: "https://www.openstreetmap.org/way/1",
        retrievedAt: "2026-09-10T00:00:00.000Z",
        contentHash: "sha256:abc",
        licenceId: "ODbL-1.0",
        attributionText: "© OpenStreetMap contributors",
        verificationStatus: "INDEPENDENTLY_VERIFIED",
        confidence: 0.9,
        machineDerived: true,
      }),
    ).toThrow(/machine-derived/i);
  });

  it("preserves duplicates, supersession and cross-source conflict states", () => {
    expect(
      classifyObservationChange({
        existing: {
          dataSourceId: "openstreetmap",
          sourceRecordId: "node/1",
          contentHash: "a",
          claimKey: "place:1:step_free",
          valueFingerprint: "true",
        },
        incoming: {
          dataSourceId: "openstreetmap",
          sourceRecordId: "node/1",
          contentHash: "a",
          claimKey: "place:1:step_free",
          valueFingerprint: "true",
        },
      }),
    ).toBe("DUPLICATE");

    expect(
      classifyObservationChange({
        existing: {
          dataSourceId: "openstreetmap",
          sourceRecordId: "node/1",
          contentHash: "a",
          claimKey: "place:1:step_free",
          valueFingerprint: "true",
        },
        incoming: {
          dataSourceId: "openstreetmap",
          sourceRecordId: "node/1",
          contentHash: "b",
          claimKey: "place:1:step_free",
          valueFingerprint: "false",
        },
      }),
    ).toBe("SUPERSEDE");

    expect(
      classifyObservationChange({
        existing: {
          dataSourceId: "openstreetmap",
          sourceRecordId: "node/1",
          contentHash: "a",
          claimKey: "place:1:step_free",
          valueFingerprint: "true",
        },
        incoming: {
          dataSourceId: "mapable-community",
          sourceRecordId: "report/77",
          contentHash: "c",
          claimKey: "place:1:step_free",
          valueFingerprint: "false",
        },
      }),
    ).toBe("CONFLICT");
  });
});

const MUNICIPAL_AND_CROSS_BORDER_SOURCE_IDS = [
  "city-of-sydney-accessibility-map",
  "city-of-melbourne-clue-building-information",
  "brisbane-spatial-accessibility-catalogue",
  "arcgis-item-ffa2876916fd4e9fa25eca58aaf497ef",
  "data-sa-disability-search",
  "city-of-darwin-accessibility-map",
  "nt-government-open-data-catalogue",
  "nt-dlpe-spatial-data-requests",
  "city-of-perth-toilet-accessibility",
  "stats-nz-datafinder-viewer-layer-123498",
] as const;

describe("Navigate municipal source admission", () => {
  it.each(MUNICIPAL_AND_CROSS_BORDER_SOURCE_IDS)(
    "blocks operational import for candidate source %s",
    (sourceId) => {
      const source = getDataSource(sourceId);
      expect(source.sourceUri).toMatch(/^https:\/\//);
      expect(source.operationalImport).toBe(false);
      expect(evaluateOperationalIngestion(source).allowed).toBe(false);
    },
  );

  it("records Perth CC BY 4.0 but still blocks operational import pending data checks", () => {
    const perth = getDataSource("city-of-perth-toilet-accessibility");
    expect(perth.licence?.id).toBe("CC-BY-4.0");
    expect(perth.licence?.attributionRequired).toBe(true);
    expect(perth.requiresDatasetLevelLicence).toBe(false);
    expect(perth.prohibitedUses).toContain("unreviewed_2022_access_observations_as_current");
    expect(evaluateOperationalIngestion(perth).allowed).toBe(false);
  });

  it("does not equate Stats NZ urban accessibility with wheelchair accessibility", () => {
    const nz = getDataSource("stats-nz-datafinder-viewer-layer-123498");
    expect(nz.prohibitedUses).toContain("wheelchair_routing");
    expect(nz.prohibitedUses).toContain("pedestrian_accessibility_inference");
    expect(nz.requiresDatasetLevelLicence).toBe(true);
    expect(evaluateOperationalIngestion(nz).allowed).toBe(false);
  });

  it("does not treat an unidentified ArcGIS item as an approved dataset", () => {
    const unknown = getDataSource("arcgis-item-ffa2876916fd4e9fa25eca58aaf497ef");
    expect(unknown.steward).toMatch(/unverified/i);
    expect(unknown.requiresDatasetLevelLicence).toBe(true);
    expect(unknown.licence).toBeNull();
  });
});

const INTERNATIONAL_RESEARCH_SOURCE_IDS = [
  "hdx-papua-new-guinea-accessibility-indicators",
  "hdx-hotosm-singapore-roads",
  "heigit-openaccesslens-global",
  "malaria-atlas-earth-engine-accessibility-catalogue",
  "singapore-lta-datamall",
  "singapore-data-gov-sg",
  "singapore-onemap",
  "india-geodata-catalogue",
  "india-open-city-geojson-catalogue",
  "wheelmap-accessibility-cloud-source-lead",
  "google-open-buildings-footprints",
] as const;

describe("International accessibility research candidate admission", () => {
  it.each(INTERNATIONAL_RESEARCH_SOURCE_IDS)(
    "blocks candidate international research source %s from production import",
    (sourceId) => {
      const source = getDataSource(sourceId);
      expect(source.operationalImport).toBe(false);
      expect(source.requiresDatasetLevelLicence).toBe(true);
      expect(evaluateOperationalIngestion(source).allowed).toBe(false);
    },
  );

  it("prevents motorised health and education access indicators from driving wheelchair navigation", () => {
    const heigit = getDataSource("heigit-openaccesslens-global");
    const malaria = getDataSource("malaria-atlas-earth-engine-accessibility-catalogue");
    expect(heigit.prohibitedUses).toContain("wheelchair_accessibility_inference");
    expect(malaria.prohibitedUses).toContain("wheelchair_navigation");
  });

  it("prevents Open Buildings footprints from becoming entrance-accessibility observations", () => {
    const buildings = getDataSource("google-open-buildings-footprints");
    expect(buildings.prohibitedUses).toContain("building_footprint_as_accessible_entrance");
  });

  it("uses the already registered OSM source rather than creating a duplicate primary network identity", () => {
    expect(getDataSource("openstreetmap").licence?.id).toBe("ODbL-1.0");
    const hotosm = getDataSource("hdx-hotosm-singapore-roads");
    expect(hotosm.prohibitedUses).toContain("duplicating_existing_osm_source_identity");
  });

  it("never inherits OpenStreetMap's licence automatically for Wheelmap partner datasets", () => {
    const wheelmap = getDataSource("wheelmap-accessibility-cloud-source-lead");
    expect(wheelmap.prohibitedUses).toContain("automatic_partner_licence_inheritance_from_osm");
    expect(wheelmap.licence).toBeNull();
  });
});
