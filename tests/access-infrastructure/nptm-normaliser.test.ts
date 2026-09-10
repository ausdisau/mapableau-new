import { describe, expect, it } from "vitest";

import {
  NPTM_DATA_SOURCE_ID,
  buildNptmProvenance,
  normalizeNationalPublicToiletRecord,
  parseNationalPublicToiletMapCsv,
  planNptmObservationChange,
} from "@/lib/access/data-sources/nptm";
import { getOntologyConcept } from "@/lib/access/intelligence-next";

describe("National Public Toilet Map CSV parsing", () => {
  it("parses quoted commas and embedded newlines without losing columns", () => {
    const csv = [
      "FacilityID,URL,Name,FacilityType,Address1,Town,State,AddressNote,Latitude,Longitude,Parking,ParkingAccessible,ParkingNote,KeyRequired,MLAK24,MLAKAfterHours,PaymentRequired,AccessNote,AdultChange,ChangingPlaces,BYOSling,ACShower,ACMLAK,AdultChangeNote,BabyChange,BabyCareRoom,BabyChangeNote,DumpPoint,DPWashout,DPAfterHours,DumpPointNote,OpeningHours,OpeningHoursNote,Male,Female,Unisex,AllGender,Ambulant,Accessible,LHTransfer,RHTransfer,ToiletNote,SharpsDisposal,DrinkingWater,SanitaryDisposal,MensPadDisposal,Shower",
      '123,https://toiletmap.gov.au/facility/123,"Park, East",Park,"1 Example St",Sydney,NSW,"Near the café, beside path",-33.8708,151.2073,FALSE,TRUE,,TRUE,TRUE,FALSE,FALSE,"Ask staff, if locked",TRUE,FALSE,FALSE,FALSE,FALSE,,FALSE,FALSE,,FALSE,FALSE,FALSE,,"Daylight hours","Closed during works\nCall council",TRUE,TRUE,TRUE,FALSE,TRUE,TRUE,TRUE,FALSE,"Accessible cubicle, east side",FALSE,TRUE,TRUE,FALSE,FALSE',
    ].join("\n");

    const rows = parseNationalPublicToiletMapCsv(csv);

    expect(rows).toHaveLength(1);
    expect(rows[0]?.FacilityID).toBe("123");
    expect(rows[0]?.Name).toBe("Park, East");
    expect(rows[0]?.OpeningHoursNote).toContain("Call council");
    expect(rows[0]?.Longitude).toBe("151.2073");
  });
});

describe("National Public Toilet Map normalisation", () => {
  it("maps requested accessibility fields to distinct Access Graph concepts", () => {
    const row = {
      FacilityID: "123",
      URL: "https://toiletmap.gov.au/facility/123",
      Name: "Example Park Toilets",
      FacilityType: "Park",
      Address1: "1 Example St",
      Town: "Sydney",
      State: "NSW",
      AddressNote: "Near the eastern gate",
      Latitude: "-33.8708",
      Longitude: "151.2073",
      Parking: "FALSE",
      ParkingAccessible: "TRUE",
      ParkingNote: "",
      KeyRequired: "TRUE",
      MLAK24: "TRUE",
      MLAKAfterHours: "FALSE",
      PaymentRequired: "FALSE",
      AccessNote: "MLAK key required after gate closes",
      AdultChange: "TRUE",
      ChangingPlaces: "FALSE",
      BYOSling: "FALSE",
      ACShower: "FALSE",
      ACMLAK: "FALSE",
      AdultChangeNote: "Adult change table available",
      BabyChange: "FALSE",
      BabyCareRoom: "FALSE",
      BabyChangeNote: "",
      DumpPoint: "FALSE",
      DPWashout: "FALSE",
      DPAfterHours: "FALSE",
      DumpPointNote: "",
      OpeningHours: "Daylight hours",
      OpeningHoursNote: "Check seasonal closures",
      Male: "TRUE",
      Female: "TRUE",
      Unisex: "TRUE",
      AllGender: "FALSE",
      Ambulant: "TRUE",
      Accessible: "TRUE",
      LHTransfer: "TRUE",
      RHTransfer: "FALSE",
      ToiletNote: "Accessible cubicle near entrance",
      SharpsDisposal: "FALSE",
      DrinkingWater: "TRUE",
      SanitaryDisposal: "TRUE",
      MensPadDisposal: "FALSE",
      Shower: "FALSE",
    } as const;

    const facility = normalizeNationalPublicToiletRecord(row, {
      retrievedAt: "2026-09-11T00:00:00.000Z",
      sourceSnapshotAt: "2026-04-01T00:00:00.000Z",
    });

    expect(facility.sourceRecordId).toBe("123");
    expect(facility.location).toEqual({ latitude: -33.8708, longitude: 151.2073 });
    expect(facility.addressText).toContain("1 Example St");
    expect(facility.observations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ontologyConceptId: "self_care_continence.accessible_toilet",
          value: true,
        }),
        expect.objectContaining({
          ontologyConceptId: "self_care_continence.ambulant_toilet",
          value: true,
        }),
        expect.objectContaining({
          ontologyConceptId: "self_care_continence.left_hand_transfer",
          value: true,
        }),
        expect.objectContaining({
          ontologyConceptId: "self_care_continence.right_hand_transfer",
          value: false,
        }),
        expect.objectContaining({
          ontologyConceptId: "self_care_continence.adult_change",
          value: true,
        }),
        expect.objectContaining({
          ontologyConceptId: "self_care_continence.changing_places",
          value: false,
        }),
        expect.objectContaining({
          ontologyConceptId: "self_care_continence.mlak_required_24h",
          value: true,
        }),
        expect.objectContaining({
          ontologyConceptId: "self_care_continence.opening_hours",
          value: "Daylight hours",
        }),
        expect.objectContaining({
          ontologyConceptId: "self_care_continence.access_information",
          value: expect.stringContaining("MLAK key required"),
        }),
      ]),
    );
  });

  it("does not turn an untrusted FALSE for a new source flag into negative evidence", () => {
    const facility = normalizeNationalPublicToiletRecord(
      {
        FacilityID: "456",
        URL: "https://toiletmap.gov.au/facility/456",
        Name: "Example Toilets",
        FacilityType: "Other",
        Address1: "2 Example St",
        Town: "Sydney",
        State: "NSW",
        Latitude: "-33.87",
        Longitude: "151.20",
        MLAKAfterHours: "FALSE",
      },
      {
        retrievedAt: "2026-09-11T00:00:00.000Z",
        sourceSnapshotAt: "2026-04-01T00:00:00.000Z",
      },
    );

    expect(
      facility.observations.some(
        (o) => o.ontologyConceptId === "self_care_continence.mlak_after_hours_access",
      ),
    ).toBe(false);
    expect(facility.limitations.join(" ")).toMatch(/false.*not.*negative|positive-evidence/i);
  });

  it("preserves the official MLAKAfterHours documentation ambiguity", () => {
    const facility = normalizeNationalPublicToiletRecord(
      {
        FacilityID: "457",
        URL: "https://toiletmap.gov.au/facility/457",
        Name: "Example Toilets",
        Latitude: "-33.87",
        Longitude: "151.20",
        MLAKAfterHours: "TRUE",
      },
      {
        retrievedAt: "2026-09-11T00:00:00.000Z",
        sourceSnapshotAt: "2026-04-01T00:00:00.000Z",
      },
    );

    const observation = facility.observations.find(
      (o) => o.ontologyConceptId === "self_care_continence.mlak_after_hours_access",
    );
    expect(observation?.value).toBe(true);
    expect(observation?.limitations.join(" ")).toMatch(/differs|required|can be used/i);

    const concept = getOntologyConcept("self_care_continence.mlak_after_hours_access");
    expect(concept?.definition).toMatch(/documentation differs/i);
    expect(concept?.prohibitedInference).toEqual(
      expect.arrayContaining([
        "infer_mlak_is_required_after_hours",
        "infer_mlak_is_optional_after_hours",
      ]),
    );
  });

  it("keeps adult change separate from Changing Places certification", () => {
    const adultChange = getOntologyConcept("self_care_continence.adult_change");
    const changingPlaces = getOntologyConcept("self_care_continence.changing_places");

    expect(adultChange?.definition).toMatch(/adult change/i);
    expect(changingPlaces?.definition).toMatch(/Changing Places/i);
    expect(changingPlaces?.definition).toMatch(/certif|registered/i);
    expect(changingPlaces?.definition).not.toMatch(/or equivalent adult change/i);
  });
});

describe("National Public Toilet Map provenance and reconciliation", () => {
  it("creates deterministic source and row fingerprints with attribution", () => {
    const first = buildNptmProvenance({
      sourceRecordId: "123",
      canonicalRecord: { FacilityID: "123", Accessible: "TRUE" },
      retrievedAt: "2026-09-11T00:00:00.000Z",
      sourceSnapshotAt: "2026-04-01T00:00:00.000Z",
      datasetContentHash: "sha256:dataset",
    });
    const second = buildNptmProvenance({
      sourceRecordId: "123",
      canonicalRecord: { Accessible: "TRUE", FacilityID: "123" },
      retrievedAt: "2026-09-11T00:00:00.000Z",
      sourceSnapshotAt: "2026-04-01T00:00:00.000Z",
      datasetContentHash: "sha256:dataset",
    });

    expect(first.dataSourceId).toBe(NPTM_DATA_SOURCE_ID);
    expect(first.contentHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(second.contentHash).toBe(first.contentHash);
    expect(first.licenceId).toBe("CC-BY-3.0-AU");
    expect(first.attributionText).toMatch(/National Public Toilet Map/i);
  });

  it("classifies duplicate, superseding and conflicting observations without overwrite", () => {
    const incoming = {
      dataSourceId: NPTM_DATA_SOURCE_ID,
      sourceRecordId: "123",
      contentHash: "sha256:new",
      claimKey: "place:1:self_care_continence.accessible_toilet",
      valueFingerprint: "true",
    };

    expect(
      planNptmObservationChange({
        incoming,
        existing: [{ ...incoming }],
      }).action,
    ).toBe("DUPLICATE");

    expect(
      planNptmObservationChange({
        incoming,
        existing: [{ ...incoming, contentHash: "sha256:old", valueFingerprint: "false" }],
      }).action,
    ).toBe("SUPERSEDE");

    const conflict = planNptmObservationChange({
      incoming,
      existing: [
        {
          dataSourceId: "mapable-community",
          sourceRecordId: "report-77",
          contentHash: "sha256:community",
          claimKey: incoming.claimKey,
          valueFingerprint: "false",
        },
      ],
    });

    expect(conflict.action).toBe("CONFLICT");
    expect(conflict.preserveExisting).toBe(true);
  });
});
