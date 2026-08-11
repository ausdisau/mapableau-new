import { describe, expect, it } from "vitest";

import type { NdisProviderSearchRow } from "@/lib/ingestion/ndis-providers-search";
import { applyHardConstraints } from "@/lib/provider/finder/matching/hard-constraints";
import {
  DEFAULT_PARTICIPANT_WEIGHTS,
  rankEligibleProviders,
} from "@/lib/provider/finder/matching/rank";

function provider(
  overrides: Partial<NdisProviderSearchRow> & { source_id: string },
): NdisProviderSearchRow {
  return {
    provider_name: "Alpha Supports",
    suburb: "Sydney",
    state: "NSW",
    postcode: "2000",
    latitude: null,
    longitude: null,
    phone: null,
    email: null,
    website: null,
    services: ["Assistance with Daily Life"],
    registration_groups: [],
    updated_at: new Date(),
    ...overrides,
  };
}

describe("Navigator hard constraints", () => {
  it("excludes participant exclusions and never relaxes to force a match", () => {
    const result = applyHardConstraints(
      [
        provider({ source_id: "p1", provider_name: "Excluded Co" }),
        provider({
          source_id: "p2",
          provider_name: "Wheelchair Accessible Care",
          services: ["Assistance with Daily Life", "wheelchair access"],
        }),
      ],
      {
        requiredAccessNeedIds: ["wheelchair"],
        excludedProviderSourceIds: ["p1"],
        requiredState: "NSW",
      },
    );

    expect(result.eligible.map((p) => p.source_id)).toEqual(["p2"]);
    expect(result.constraintsNotRelaxed).toBe(true);
    expect(result.noMatch).toBe(false);
  });

  it("returns explicit no-match when access needs are unmet", () => {
    const result = applyHardConstraints(
      [provider({ source_id: "p1", services: ["Transport"] })],
      {
        requiredAccessNeedIds: ["auslan"],
        excludedProviderSourceIds: [],
      },
    );
    expect(result.noMatch).toBe(true);
    expect(result.eligible).toHaveLength(0);
    expect(result.rejected[0]?.reasons).toContain(
      "access_or_communication_requirement",
    );
  });

  it("does not let ranking resurrect hard-rejected providers", () => {
    const hard = applyHardConstraints(
      [provider({ source_id: "p1", state: "VIC" })],
      {
        requiredAccessNeedIds: [],
        excludedProviderSourceIds: [],
        requiredState: "NSW",
      },
    );
    const ranked = rankEligibleProviders(
      hard.eligible,
      DEFAULT_PARTICIPANT_WEIGHTS,
      {},
    );
    expect(hard.noMatch).toBe(true);
    expect(ranked).toHaveLength(0);
  });
});
