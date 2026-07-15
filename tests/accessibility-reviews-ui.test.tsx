import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { AccessPlaceCard } from "@/components/access/AccessPlaceCard";
import { ACCESS_LABELS } from "@/lib/access-map/copy";

describe("access place list accessibility states", () => {
  it("exposes text labels for secondary states, not colour alone", () => {
    render(
      <AccessPlaceCard
        place={{
          id: "p1",
          name: "Town Hall",
          category: "civic",
          reviewCount: 2,
          hasTemporaryAlert: true,
          informationMayBeStale: true,
          hasProfessionalAssessment: true,
        }}
      />
    );

    expect(
      screen.getByText(ACCESS_LABELS.communityInfoAvailable)
    ).toBeTruthy();
    expect(
      screen.getByText(ACCESS_LABELS.temporaryBarrierReported)
    ).toBeTruthy();
    expect(
      screen.getByText(ACCESS_LABELS.informationMayBeStale)
    ).toBeTruthy();
    expect(
      screen.getByText(ACCESS_LABELS.professionalAssessmentAvailable)
    ).toBeTruthy();
    expect(
      screen.getByRole("list", { name: "Access information state" })
    ).toBeTruthy();
  });
});
