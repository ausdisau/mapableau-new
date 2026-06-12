import { describe, expect, it } from "vitest";

import type { ProviderOutlet } from "@/data/provider-outlets.types";
import {
  accessNeedIdsFromHaystack,
  classificationFieldsFromOutlet,
  classifyProviderOutlet,
  fundingFromActive,
  providerOutletFromRaw,
  summarizeClassifications,
  supportTypesFromRegGroupIndices,
} from "@/lib/provider-finder/classify-outlet";

const sampleOutlet: ProviderOutlet = {
  ABN: "12345678901",
  Prov_N: "Harbour Support Co.",
  Head_Office: "Parramatta NSW 2150",
  Outletname: "Harbour Support Co.",
  Flag: "O",
  Active: 1,
  Phone: "",
  Website: "",
  Email: "",
  Address: "1 George St, Parramatta NSW 2150",
  State_cd: "NSW",
  Post_cd: 2150,
  Latitude: -33.81,
  Longitude: 151.0,
  RegGroup: [4, 5, 29],
  Post_cd_p: "",
  opnhrs: "",
  prfsn: "Occupational Therapy|Support Worker",
};

describe("supportTypesFromRegGroupIndices", () => {
  it("maps transport, personal care, and therapy reg groups", () => {
    expect(supportTypesFromRegGroupIndices([4, 5, 29])).toEqual([
      "personal-care",
      "transport",
      "therapy",
    ]);
  });

  it("maps employment reg groups", () => {
    expect(supportTypesFromRegGroupIndices([35, 36])).toEqual(["employment"]);
  });
});

describe("accessNeedIdsFromHaystack", () => {
  it("detects wheelchair and auslan keywords", () => {
    const ids = accessNeedIdsFromHaystack(
      "wheelchair accessible transport with auslan interpreter",
    );
    expect(ids).toContain("wheelchair");
    expect(ids).toContain("auslan");
  });
});

describe("fundingFromActive", () => {
  it("maps active outlets to ndis funding", () => {
    expect(fundingFromActive(true)).toBe("ndis");
    expect(fundingFromActive(false)).toBe("private");
  });
});

describe("classifyProviderOutlet", () => {
  it("classifies outlet with support types, funding, and categories", () => {
    const result = classifyProviderOutlet(sampleOutlet, 0);
    expect(result.funding).toBe("ndis");
    expect(result.supportTypes).toEqual(["personal-care", "transport", "therapy"]);
    expect(result.categories.length).toBeGreaterThan(0);
    expect(result.state).toBe("NSW");
  });
});

describe("classificationFieldsFromOutlet", () => {
  it("returns support types and access need ids for persistence", () => {
    const fields = classificationFieldsFromOutlet(sampleOutlet);
    expect(fields.supportTypes).toEqual(["personal-care", "transport", "therapy"]);
    expect(fields.accessNeedIds).toEqual([]);
  });
});

describe("providerOutletFromRaw", () => {
  it("parses stored raw JSON when present", () => {
    const parsed = providerOutletFromRaw(sampleOutlet);
    expect(parsed?.ABN).toBe("12345678901");
    expect(parsed?.RegGroup).toEqual([4, 5, 29]);
  });

  it("builds outlet from registry columns when raw is missing", () => {
    const parsed = providerOutletFromRaw(null, {
      ABN: sampleOutlet.ABN,
      Prov_N: sampleOutlet.Prov_N,
      RegGroup: sampleOutlet.RegGroup,
      State_cd: sampleOutlet.State_cd,
      Active: sampleOutlet.Active,
    });
    expect(parsed?.ABN).toBe("12345678901");
    expect(parsed?.RegGroup).toEqual([4, 5, 29]);
  });

  it("returns null without raw or ABN fallback", () => {
    expect(providerOutletFromRaw(null)).toBeNull();
    expect(providerOutletFromRaw({ foo: "bar" })).toBeNull();
  });
});

describe("summarizeClassifications", () => {
  it("aggregates counts by support type and funding", () => {
    const rows = [
      classifyProviderOutlet(sampleOutlet, 0),
      classifyProviderOutlet({ ...sampleOutlet, Active: 0, RegGroup: [35] }, 1),
    ];
    const summary = summarizeClassifications(rows);
    expect(summary.total).toBe(2);
    expect(summary.activeCount).toBe(1);
    expect(summary.byFunding.ndis).toBe(1);
    expect(summary.byFunding.private).toBe(1);
    expect(summary.bySupportType.employment).toBe(1);
  });
});
