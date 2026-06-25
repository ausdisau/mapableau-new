/**
 * @vitest-environment jsdom
 */
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { GovernanceStatusCard } from "@/components/governance/GovernanceStatusCard";
import { ConsentSummary } from "@/components/governance/ConsentSummary";
import { AttestationBadge } from "@/components/governance/AttestationBadge";

afterEach(() => cleanup());

describe("GovernanceStatusCard", () => {
  it("renders blocked state with explanation link", () => {
    render(<GovernanceStatusCard status="blocked_by_rule" live={false} />);
    expect(screen.getByText(/Cannot proceed yet/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: /Why am I seeing this/i })).toBeTruthy();
  });
});

describe("ConsentSummary", () => {
  it("shows granted and not granted items", () => {
    render(
      <ConsentSummary
        items={[
          { id: "a", label: "Share with employer", granted: false, sensitive: true },
          { id: "b", label: "Share adjustments", granted: true },
        ]}
      />,
    );
    expect(screen.getByText("Share with employer")).toBeTruthy();
    expect(screen.getByText("Sensitive")).toBeTruthy();
  });
});

describe("AttestationBadge", () => {
  it("renders recorded status with text", () => {
    render(<AttestationBadge status="recorded" />);
    expect(screen.getByText("Attestation recorded")).toBeTruthy();
  });
});
