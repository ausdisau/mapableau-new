import { describe, expect, it } from "vitest";
import {
  parseDirectoryActivity,
  interpretAacDeclaration,
  isAffirmativeServiceLabel,
  matchesDirectoryFilter,
  getProviderEvidence,
} from "@/lib/provider/finder/evidence";

describe("provider finder evidence gating", () => {
  it.each(["unregistered", "Not registered", "Not approved", "Inactive", "Suspended", "Revoked"])(
    "never promotes negative registration string %s",
    (value) => expect(parseDirectoryActivity(value)).toBe("not_active_in_source"),
  );
  it.each(["Registered", "approved", "ACTIVE", "1"])(
    "recognises exact local snapshot status %s",
    (value) => expect(parseDirectoryActivity(value)).toBe("active_in_source"),
  );
  it("fails closed on ambiguous states", () => {
    expect(parseDirectoryActivity("approved pending review")).toBe("unknown");
    expect(parseDirectoryActivity(undefined)).toBe("unknown");
    expect(parseDirectoryActivity(null)).toBe("unknown");
  });
  it.each(["No AAC support", "AAC not available", "AAC unsupported", "We do not provide AAC", "We do not currently provide AAC", "Unable to provide AAC", "AAC not offered"])(
    "does not promote negative AAC text %s",
    (value) => expect(interpretAacDeclaration(value)).toBe("not_supported"),
  );
  it("does not turn an unqualified AAC mention into an affirmative capability", () => {
    expect(interpretAacDeclaration("AAC")).toBe("unknown");
    expect(interpretAacDeclaration("Supports AAC")).toBe("supported");
    expect(interpretAacDeclaration("Offers AAC")).toBe("supported");
    expect(interpretAacDeclaration("AAC available")).toBe("supported");
  });
  it.each(["Not offering Daily Personal Activities", "No personal care", "Daily life not available", "We do not provide support coordination", "No vacancies"])(
    "does not promote a negative service statement %s",
    (value) => expect(isAffirmativeServiceLabel(value)).toBe(false),
  );
  it("does not equate a demo or absent provenance with live provider evidence", () => {
    expect(matchesDirectoryFilter({ source: "demo", directoryActivity: "active_in_source" }, "ndis")).toBe(false);
    expect(matchesDirectoryFilter({ source: "unknown", directoryActivity: "active_in_source" }, "ndis")).toBe(false);
  });
  it("separates imported activity from current registration and worker clearance", () => {
    const evidence = getProviderEvidence({
      source: "ndis_import",
      directoryActivity: "active_in_source",
      abn: "12345678901",
    });
    expect(evidence.directoryActivity).toContain("Marked active");
    expect(evidence.registration).toContain("not independently verified");
    expect(evidence.workerScreening).toContain("not independently verified");
    expect(evidence.availability).toContain("Not confirmed");
  });
  it("keeps source status and worker-screening boundaries under 512 interleaved synthetic checks", async () => {
    // Microtask reentrancy only. This is not an HTTP or production load test.
    const values = ["Unregistered", "Registered", "Not approved", "Pending", "Suspended", "ACTIVE"];
    const expected = [
      "not_active_in_source",
      "active_in_source",
      "not_active_in_source",
      "unknown",
      "not_active_in_source",
      "active_in_source",
    ];
    const results = await Promise.all(
      Array.from({ length: 512 }, (_, i) =>
        Promise.resolve().then(() => {
          const activity = parseDirectoryActivity(values[i % values.length]);
          const evidence = getProviderEvidence({
            source: "ndis_import",
            directoryActivity: activity,
            abn: "12345678901",
          });
          return { activity, evidence };
        }),
      ),
    );
    expect(results).toHaveLength(512);
    for (const [index, result] of results.entries()) {
      expect(result.activity).toBe(expected[index % expected.length]);
      expect(result.evidence.registration).toContain("not independently verified");
      expect(result.evidence.workerScreening).toContain("not independently verified");
    }
  });

});
