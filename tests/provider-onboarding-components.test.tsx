/**
 * @vitest-environment jsdom
 */
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { OnboardingStepper } from "@/components/provider-onboarding/OnboardingStepper";
import { ProviderOnboardingWizard } from "@/components/provider-onboarding/ProviderOnboardingWizard";
import type { ProviderOnboardingState } from "@/types/provider-onboarding";

afterEach(() => {
  cleanup();
});

const baseState: ProviderOnboardingState = {
  organisationId: "org-1",
  organisation: {
    id: "org-1",
    name: "Sunrise Supports",
    abn: "12345678901",
    organisationType: "care_provider",
    contactEmail: "hello@sunrise.test",
    contactPhone: "0400000000",
    website: null,
    address: "1 Main St",
    serviceRegions: ["Melbourne Metro"],
    notes: "Community care",
    ndisRegistrationClaimed: true,
    ndisRegistrationNumber: "4050000000",
    insuranceStatus: "held_current",
    verificationStatus: "not_started",
  },
  workflowId: "wf-1",
  tasks: [
    {
      id: "t1",
      taskKey: "organisation_profile",
      title: "Organisation profile",
      status: "completed",
    },
  ],
  currentStep: "review",
  completedSteps: ["organisation", "regions", "ndis", "insurance"],
  submitted: false,
  canAccessConsole: false,
};

describe("OnboardingStepper", () => {
  it("renders step labels and marks current step", () => {
    render(
      <OnboardingStepper
        currentStep="ndis"
        completedSteps={["organisation", "regions"]}
      />,
    );
    expect(screen.getByRole("navigation", { name: /onboarding progress/i })).toBeTruthy();
    expect(screen.getByText("NDIS")).toBeTruthy();
    expect(screen.getByText("Organisation")).toBeTruthy();
  });
});

describe("ProviderOnboardingWizard", () => {
  it("renders review step with organisation name", () => {
    render(<ProviderOnboardingWizard initialState={baseState} />);
    expect(screen.getByRole("heading", { name: /provider onboarding/i })).toBeTruthy();
    expect(screen.getByText("Sunrise Supports")).toBeTruthy();
    expect(screen.getByRole("button", { name: /submit for review/i })).toBeTruthy();
  });

  it("shows submitted state when application is pending", () => {
    const submitted: ProviderOnboardingState = {
      ...baseState,
      submitted: true,
      organisation: {
        ...baseState.organisation,
        verificationStatus: "pending_review",
      },
    };
    render(<ProviderOnboardingWizard initialState={submitted} />);
    expect(screen.getByRole("heading", { name: /application under review/i })).toBeTruthy();
  });
});
