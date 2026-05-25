/**
 * @vitest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProviderVerificationPanel } from "@/components/providers/ProviderVerificationPanel";
import { ProviderRequestSupportButton } from "@/components/providers/ProviderRequestSupportButton";
import type { PublicProviderProfile } from "@/types/provider-profile";

const sampleProfile: PublicProviderProfile = {
  id: "p1",
  slug: "sample-care",
  name: "Sample Care",
  verificationLabel: "unverified",
  verificationDisplay: "Unverified",
  ndisRegistered: false,
  services: [{ id: "s1", name: "Personal care" }],
  regions: [{ id: "r1", label: "Parramatta, NSW" }],
  accessFeatures: [],
  languages: [],
  contact: {},
  rating: 0,
  reviewCount: 0,
  reviews: [],
  supports: ["In-person"],
  categories: ["Personal care"],
  source: "directory",
  showUnverifiedWarning: true,
  canRequestSupport: true,
};

describe("Provider profile UI", () => {
  it("shows unverified warning in verification panel", () => {
    render(
      <ProviderVerificationPanel
        label="unverified"
        display="Unverified"
        ndisRegistered={false}
        showWarning
      />,
    );
    expect(screen.getByText(/does not endorse/i)).toBeTruthy();
    expect(screen.getByText(/Status:/)).toBeTruthy();
  });

  it("request button links to booking flow", () => {
    render(
      <ProviderRequestSupportButton
        providerId={sampleProfile.id}
        providerName={sampleProfile.name}
        slug={sampleProfile.slug}
      />,
    );
    const link = screen.getByRole("link", {
      name: /request support from sample care/i,
    });
    expect(link.getAttribute("href")).toContain("/dashboard/bookings/new");
    expect(link.getAttribute("href")).toContain("providerId=p1");
  });
});
