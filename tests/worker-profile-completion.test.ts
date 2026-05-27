import { describe, expect, it } from "vitest";

import {
  isWorkerProfileComplete,
  postLoginPathForRole,
  workerOnboardingPath,
} from "@/lib/workers/profile-completion";

describe("isWorkerProfileComplete", () => {
  it("returns false when required fields are missing", () => {
    expect(
      isWorkerProfileComplete({
        displayName: "Alex",
        profileSummary: null,
        serviceTypes: [],
        serviceRegions: [],
        qualificationsSummary: null,
      })
    ).toBe(false);
  });

  it("returns true when basics and service coverage are set", () => {
    expect(
      isWorkerProfileComplete({
        displayName: "Alex",
        profileSummary: "NDIS support worker",
        serviceTypes: ["personal_care"],
        serviceRegions: ["Melbourne Metro"],
        qualificationsSummary: "Cert III",
      })
    ).toBe(true);
  });

  it("routes incomplete support workers to onboarding", () => {
    expect(
      postLoginPathForRole(
        "support_worker",
        {
          displayName: "Alex",
          profileSummary: null,
          serviceTypes: [],
          serviceRegions: [],
          qualificationsSummary: null,
        },
        null
      )
    ).toBe(workerOnboardingPath());
  });
});
