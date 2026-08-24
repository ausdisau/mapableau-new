import { describe, expect, it } from "vitest";

import {
  addAccessEvidenceConflict,
  buildMissionEvidenceBundle,
} from "@/lib/ai/platform/missions";

describe("Mission evidence bundle", () => {
  it("works without profile when participant declines profile use", () => {
    const bundle = buildMissionEvidenceBundle({
      missionId: "m1",
      actorId: "p1",
      participantId: "p1",
      objective: "Interview tomorrow",
      requestedUseOfAccessibilityProfile: false,
      plainLanguage: true,
      consentScopes: [],
      source: "participant_text",
      traceId: "t1",
    });
    expect(bundle.systemSupplied).toHaveLength(0);
    expect(bundle.missing).toContain("calendar_event");
    expect(bundle.verified).toHaveLength(0);
  });

  it("marks profile missing when consent not granted", () => {
    const bundle = buildMissionEvidenceBundle({
      missionId: "m1",
      actorId: "p1",
      participantId: "p1",
      objective: "Need transport",
      requestedUseOfAccessibilityProfile: true,
      profileConsentGranted: false,
      plainLanguage: true,
      consentScopes: [],
      source: "participant_text",
      traceId: "t1",
    });
    expect(bundle.missing).toContain("accessibility_profile_consent");
  });

  it("preserves conflicting access evidence without reconciliation", () => {
    const base = buildMissionEvidenceBundle({
      missionId: "m1",
      actorId: "p1",
      participantId: "p1",
      objective: "Visit venue",
      requestedUseOfAccessibilityProfile: false,
      plainLanguage: true,
      consentScopes: [],
      source: "participant_text",
      traceId: "t1",
    });
    const conflicted = addAccessEvidenceConflict(base);
    expect(conflicted.conflicting).toHaveLength(1);
    expect(conflicted.conflicting[0]?.items).toHaveLength(2);
  });

  it("never marks model inference as verified", () => {
    const bundle = buildMissionEvidenceBundle({
      missionId: "m1",
      actorId: "p1",
      participantId: "p1",
      objective: "Test",
      requestedUseOfAccessibilityProfile: false,
      plainLanguage: true,
      consentScopes: [],
      source: "participant_text",
      traceId: "t1",
    });
    for (const item of bundle.participantSupplied) {
      expect(item.verified).toBe(false);
    }
  });
});
