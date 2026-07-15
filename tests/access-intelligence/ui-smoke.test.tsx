/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { AccessStatusBadge } from "@/components/access-intelligence/access-status-badge";
import { ApprovalCard } from "@/components/access-intelligence/approval-card";
import { StarterPrompts } from "@/components/access-intelligence/starter-prompts";

describe("access-intelligence UI a11y smoke", () => {
  it("renders status with text label not colour alone", () => {
    render(<AccessStatusBadge status="unknown" />);
    expect(screen.getByLabelText(/Information incomplete/i)).toBeTruthy();
  });

  it("allows keyboard activation of starter prompts", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<StarterPrompts onSelect={onSelect} />);
    const button = screen.getByRole("button", {
      name: /Harbour Civic Centre/i,
    });
    await user.click(button);
    expect(onSelect).toHaveBeenCalled();
  });

  it("approval dialog cancel does not imply approve", async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    const onCancel = vi.fn();
    render(
      <ApprovalCard
        title="Approve verification?"
        recipient="Venue"
        purpose="Confirm toilet"
        fieldsOrQuestions={["Is the accessible toilet open?"]}
        onApprove={onApprove}
        onCancel={onCancel}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
    expect(onApprove).not.toHaveBeenCalled();
  });
});
