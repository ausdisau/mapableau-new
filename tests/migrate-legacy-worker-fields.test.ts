import { describe, expect, it } from "vitest";

import { mapLegacyWorkerToProfileFields } from "@/lib/workers/migrate-legacy-worker-fields";

describe("mapLegacyWorkerToProfileFields", () => {
  it("maps bio, qualifications, and relation names", () => {
    const mapped = mapLegacyWorkerToProfileFields({
      id: "worker-uuid-1",
      bio: "Experienced carer",
      qualifications: "Cert III",
      languages: [{ name: "English" }, { name: "Auslan" }],
      specialisations: [{ name: "Autism" }],
    });

    expect(mapped).toEqual({
      legacyWorkerId: "worker-uuid-1",
      profileSummary: "Experienced carer",
      qualificationsSummary: "Cert III",
      languages: ["English", "Auslan"],
      specialisations: ["Autism"],
    });
  });
});
