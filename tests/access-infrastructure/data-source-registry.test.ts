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
