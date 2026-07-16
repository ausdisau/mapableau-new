import { afterEach, describe, expect, it } from "vitest";

import {
  isY1WedgeStagingDefaultsActive,
  y1WedgeConfig,
} from "@/lib/config/y1-wedge";
import {
  defaultSupportProfileSections,
  mergeSupportProfileSections,
  participantSafeSupportProfileSummary,
} from "@/lib/support-profile/types";
import { participantSafeCandidateSummary } from "@/lib/matching/matching-service";
import {
  validateIncidentIntakePath,
  type IncidentIntakeWizardSteps,
} from "@/lib/incidents/incident-service";
import { isMicroConsentEnabled } from "@/lib/consent/micro-consent-service";

describe("Y1 wedge config", () => {
  const envSnapshot = { ...process.env };

  afterEach(() => {
    process.env = { ...envSnapshot };
  });

  it("disables wedge features in test environment by default", () => {
    process.env.NODE_ENV = "test";
    delete process.env.MAPABLE_Y1_WEDGE_STAGING;
    delete process.env.VERCEL_ENV;
    delete process.env.SUPPORT_PROFILE_ENABLED;
    delete process.env.PARTICIPANT_MATCH_REVIEW_ENABLED;

    expect(y1WedgeConfig.supportProfileEnabled).toBe(false);
    expect(y1WedgeConfig.participantMatchReviewEnabled).toBe(false);
    expect(y1WedgeConfig.incidentIntakeV2Enabled).toBe(false);
    expect(y1WedgeConfig.microConsentEnabled).toBe(false);
    expect(y1WedgeConfig.backupShiftRecoveryEnabled).toBe(false);
  });

  it("exposes staging defaults helper", () => {
    expect(typeof isY1WedgeStagingDefaultsActive()).toBe("boolean");
  });
});

describe("Support profile sections", () => {
  it("merges draft updates without dropping unknown keys", () => {
    const base = defaultSupportProfileSections();
    const merged = mergeSupportProfileSections(base, {
      routinesJson: [{ label: "Morning routine", detail: "Breakfast at 8am" }],
    });
    expect(merged.routinesJson).toHaveLength(1);
    expect(merged.boundariesJson).toEqual([]);
  });

  it("summarises published sections for matching UI", () => {
    const summary = participantSafeSupportProfileSummary({
      ...defaultSupportProfileSections(),
      routinesJson: [{ label: "Morning", detail: "Tea first" }],
    });
    expect(summary.routineCount).toBe(1);
  });
});

describe("Explainable matching summaries", () => {
  it("returns participant-safe copy with top factors", () => {
    const summary = participantSafeCandidateSummary({
      score: 0.8,
      scoreExplanation: "Worker verification status is verified.",
      candidateType: "care_worker",
      status: "recommended",
      factors: [
        { factorType: "credential_status", explanation: "Worker is verified." },
      ],
    });
    expect(summary.matchQuality).toContain("Good fit");
    expect(summary.topFactors).toHaveLength(1);
  });
});

describe("Incident intake v2 validation", () => {
  const base: IncidentIntakeWizardSteps = {
    intakePath: "concern",
    category: "complaint",
    severity: "medium",
    title: "Test",
    description: "Details",
  };

  it("rejects safeguarding path without safeguarding flag", () => {
    expect(
      validateIncidentIntakePath({ ...base, intakePath: "safeguarding" }),
    ).toContain("Safeguarding");
  });

  it("accepts valid concern path", () => {
    expect(validateIncidentIntakePath(base)).toBeNull();
  });
});

describe("Micro-consent", () => {
  it("is off unless both flags enabled", () => {
    expect(isMicroConsentEnabled()).toBe(false);
  });
});
