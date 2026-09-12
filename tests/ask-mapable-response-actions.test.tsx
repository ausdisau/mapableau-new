/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AskMapAbleResponseActions } from "@/components/ask-mapable/AskMapAbleResponseActions";
import type { CopilotAction } from "@/lib/copilot/types";

afterEach(() => {
  cleanup();
});

describe("AskMapAbleResponseActions", () => {
  it("allows navigation only for non-confirmation actions", () => {
    const actions: CopilotAction[] = [
      {
        type: "OPEN_PROVIDER_SEARCH",
        label: "Open provider search",
        requiresConfirmation: false,
        href: "/provider-finder",
      },
      {
        type: "CREATE_DRAFT_SERVICE_EVENT",
        label: "Prepare a service request",
        requiresConfirmation: true,
        href: "/care",
      },
    ];

    render(<AskMapAbleResponseActions actions={actions} />);

    const safeLink = screen.getByRole("link", { name: /open provider search/i });
    expect(safeLink.getAttribute("href")).toBe("/provider-finder");
    expect(
      screen.queryByRole("link", { name: /prepare a service request/i }),
    ).toBeNull();
    expect(screen.getByText(/review and confirmation are required/i)).toBeTruthy();
  });

  it("keeps blocked actions visible without making them executable", () => {
    render(
      <AskMapAbleResponseActions
        actions={[]}
        blockedActions={[
          {
            type: "SAFETY_ESCALATION",
            label: "Safety escalation",
            requiresConfirmation: true,
          },
        ]}
      />,
    );

    expect(screen.getByText(/not available from this conversation/i)).toBeTruthy();
    expect(screen.getByText("Safety escalation")).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
  });
});
