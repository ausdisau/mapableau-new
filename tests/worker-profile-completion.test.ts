import { describe, expect, it } from "vitest";

import {
  isWorkerProfileComplete,
  postLoginPathForRole,
  workerOnboardingPath,
  workerProfilePath,
} from "@/lib/workers/profile-completion";

const completeProfile = {
  displayName: "Alex",
  profileSummary: "NDIS support worker",
  serviceTypes: ["personal_care"],
  serviceRegions: ["Melbourne Metro"],
  qualificationsSummary: "Cert III",
  verificationStatus: "pending" as const,
};

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
          verificationStatus: "pending",
        },
        null
      )
    ).toBe(workerOnboardingPath());
  });

  it("routes complete but unverified workers to profile", () => {
    expect(
      postLoginPathForRole("support_worker", completeProfile, null)
    ).toBe(workerProfilePath());
  });

  it("routes verified workers to today", () => {
    expect(
      postLoginPathForRole(
        "support_worker",
        { ...completeProfile, verificationStatus: "verified" },
        null
      )
    ).toBe("/worker/today");
  });
});
