/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { AccessPlaceCard } from "@/components/access/AccessPlaceCard";
import { ACCESS_LABELS } from "@/lib/access-map/copy";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

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
