import { describe, expect, it } from "vitest";

import { rankPublishedWorker, rankDirectoryProvider } from "@/lib/provider/finder/personalisation/matching";

const worker = {
  id: "w1",
  displayName: "Example Worker",
  profileSummary: "Sample only",
  serviceTypes: ["personal_care"],
  serviceRegions: ["Sydney NSW"],
  languages: ["English", "Auslan"],
};

describe("opt-in directory match ranking", () => {
  it("does not manufacture a match for an explicit unsupported service", () => {
    expect(rankPublishedWorker(worker, { explicitService: "physiotherapy" })).toBeNull();
  });
  it("does not manufacture an explicit region match", () => {
    expect(rankPublishedWorker(worker, { explicitLocation: "Perth WA" })).toBeNull();
  });
  it("ranks only attributes the worker has declared", () => {
    const fit = rankPublishedWorker(worker, {
      explicitService: "personal care",
      preferredLocation: "Sydney NSW",
      preferredLanguage: "Auslan",
    });
    expect(fit?.score).toBeGreaterThan(0);
    expect(fit?.reasons).toContain("Matches saved language preference");
  });
  it("treats broad support-worker intent as non-specialist", () => {
    expect(rankPublishedWorker(worker, { explicitService: "support worker" })).not.toBeNull();
  });
  it("never labels an NDIS directory record as currently verified", () => {
    const result = rankDirectoryProvider({
      id: "p1", slug: "one", name: "Provider",
      suburb: "Sydney", state: "NSW", postcode: "2000", locationLabel: "Sydney NSW 2000",
      registered: true, registrationGroups: ["Daily activities"],
      services: ["personal care"], phone: null, website: null,
    }, { enabled: true, location: "Sydney", supportType: "personal care", language: null });
    expect(result.match.source).toContain("Imported");
    expect(result.match.caution).toContain("does not establish current registration");
    expect(result.match.reasons).toContain("Matches saved support type");
  });
});
