/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AccessGraphEvidencePanel } from "@/components/access/AccessGraphEvidencePanel";
import { projectAccessGraphEvidence } from "@/lib/access/experience/project-access-graph-evidence";
import { toPublicAccessObservation } from "@/lib/access/infrastructure/public-observation";

describe("public Access Graph evidence projection", () => {
  it("strips observer identity from infrastructure HTTP projections", () => {
    const publicObservation = toPublicAccessObservation({
      id: "obs-public",
      observerUserId: "user-secret",
      featureKey: "lift_present",
    });

    expect(publicObservation).toEqual({
      id: "obs-public",
      featureKey: "lift_present",
    });
    expect(JSON.stringify(publicObservation)).not.toContain("user-secret");
  });

  it("strips internal observer/entity identifiers from the client-safe DTO", () => {
    const projected = projectAccessGraphEvidence({
      placeId: "place-1",
      featureCount: 1,
      expiredCount: 0,
      unverifiedCount: 1,
      productionClaim: "none",
      claimState: "in_development",
      note: "Unknown ≠ inaccessible.",
      observations: [
        {
          id: "obs-1",
          featureKey: "lift_present",
          ontologyConceptId: "access.lift.present",
          value: true,
          unit: null,
          observedAt: "2026-10-01T00:00:00.000Z",
          confidence: 0.8,
          disputed: false,
          observerUserId: "user-secret",
          entityId: "internal-entity",
          entityType: "place",
          sourceType: "community",
          evidenceKinds: ["community_observation"],
          canonicalProvenance: { internal: true },
          provenance: {
            sourceClass: "community_reported",
            verificationStatus: "community_reported",
            displayLabel: "Community reported",
            unverified: true,
            aiInferred: false,
          },
          freshness: {
            state: "fresh",
            policyDescription: "Review periodically",
            expiresAt: "2027-01-01T00:00:00.000Z",
          },
        },
      ],
    });

    const serialized = JSON.stringify(projected);
    expect(serialized).not.toContain("user-secret");
    expect(serialized).not.toContain("internal-entity");
    expect(serialized).not.toContain("canonicalProvenance");
    expect(projected.observations[0]?.provenance.unverified).toBe(true);
  });
});

describe("AccessGraphEvidencePanel", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("does not render when the Access Graph UI gate is disabled", () => {
    render(<AccessGraphEvidencePanel placeId="place-1" enabled={false} />);
    expect(screen.queryByText(/why does mapable say this/i)).toBeNull();
  });

  it("loads lazily and labels AI, disputed and outdated evidence", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        evidence: {
          placeId: "place-1",
          featureCount: 1,
          observationCount: 1,
          expiredCount: 1,
          unverifiedCount: 1,
          productionClaim: "none",
          claimState: "in_development",
          note:
            "Unknown ≠ inaccessible. AI-inferred and expired assertions are never presented as verified fact.",
          observations: [
            {
              id: "obs-ai",
              featureKey: "step_free_entry",
              ontologyConceptId: "access.entry.step_free",
              value: true,
              unit: null,
              observedAt: "2025-01-01T00:00:00.000Z",
              confidence: 0.42,
              disputed: true,
              provenance: {
                sourceClass: "expired",
                verificationStatus: "outdated",
                displayLabel: "Expired",
                unverified: true,
                aiInferred: true,
              },
              freshness: {
                state: "expired",
                policyDescription: "Re-check after material change",
                expiresAt: "2025-06-01T00:00:00.000Z",
              },
            },
          ],
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<AccessGraphEvidencePanel placeId="place-1" enabled />);

    expect(fetchMock).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /show evidence/i }));

    expect(await screen.findByText("Step Free Entry")).toBeTruthy();
    expect(
      screen.getByText(/ai-inferred evidence is unverified/i),
    ).toBeTruthy();
    expect(screen.getByText(/this observation is disputed/i)).toBeTruthy();
    expect(screen.getByText(/this observation is outdated/i)).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
