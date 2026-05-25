/** @vitest-environment jsdom */
import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { CaseloadTable } from "@/components/support-coordinator/CaseloadTable";
import { ConsentStatusBanner } from "@/components/support-coordinator/ConsentStatusBanner";
import { ClaimValidationSummary } from "@/components/plan-manager/ClaimValidationSummary";
import { FundingNotesPanel } from "@/components/home-modifications/FundingNotesPanel";

describe("accessible UI components", () => {
  it("renders caseload table with consent badges", () => {
    render(
      <CaseloadTable
        rows={[
          {
            participantId: "p1",
            relationshipId: "r1",
            status: "active",
            consentActive: true,
            displayName: "Alex Rivers",
            homeSuburb: "Brunswick",
          },
        ]}
      />
    );
    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.getByText("Alex Rivers")).toBeTruthy();
    expect(screen.getByText("Consent active")).toBeTruthy();
  });

  it("shows consent required banner when inactive", () => {
    render(
      <ConsentStatusBanner
        consentActive={false}
        message="Consent required for this participant."
      />
    );
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getAllByText("Consent required").length).toBeGreaterThan(0);
  });

  it("renders claim validation warnings in plain language", () => {
    render(
      <ClaimValidationSummary
        warnings={["Line item missing NDIS support item code."]}
      />
    );
    expect(screen.getByText(/Line item missing/)).toBeTruthy();
  });

  it("funding notes panel includes disclaimer", () => {
    render(<FundingNotesPanel notes="May need OT report" />);
    expect(screen.getByText(/does not guarantee/i)).toBeTruthy();
  });

  it("mobile layout uses responsive containers", () => {
    const { container } = render(
      <CaseloadTable
        rows={[
          {
            participantId: "p1",
            relationshipId: "r1",
            status: "active",
            consentActive: false,
            displayName: "Test",
          },
        ]}
      />
    );
    expect(container.querySelector(".overflow-x-auto")).toBeTruthy();
  });
});
