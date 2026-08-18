/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, beforeEach, vi } from "vitest";

import { AccessibilityProfileFormRefactored } from "@/components/forms/AccessibilityProfileFormRefactored";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}));

// Mock fetch
global.fetch = vi.fn();

describe("AccessibilityProfileFormRefactored", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("renders form with all sections", () => {
    render(
      <AccessibilityProfileFormRefactored
        initial={{
          mobilityNeeds: [],
          communicationPreferences: [],
          transportRequirements: {},
          digitalPreferences: {},
        }}
      />
    );

    expect(screen.getByText(/Mobility/)).toBeInTheDocument();
    expect(screen.getByText(/Communication/)).toBeInTheDocument();
    expect(screen.getByText(/Transport access/)).toBeInTheDocument();
    expect(screen.getByText(/Digital interface/)).toBeInTheDocument();
  });

  it("initializes with provided preferences", () => {
    render(
      <AccessibilityProfileFormRefactored
        initial={{
          mobilityNeeds: ["manual_wheelchair"],
          communicationPreferences: ["plain_language", "sms"],
          transportRequirements: {
            requiresWheelchairAccessibleVehicle: true,
          },
          digitalPreferences: {
            largeText: true,
          },
        }}
      />
    );

    const wheelchairCheckbox = screen.getByRole("checkbox", {
      name: /wheelchair/i,
    });
    expect(wheelchairCheckbox).toBeChecked();
  });

  it("allows toggling checkbox options", async () => {
    const user = userEvent.setup();
    render(
      <AccessibilityProfileFormRefactored
        initial={{
          mobilityNeeds: [],
          communicationPreferences: [],
          transportRequirements: {},
          digitalPreferences: {},
        }}
      />
    );

    const mobilityCheckbox = screen.getByRole("checkbox", {
      name: /manual wheelchair/i,
    });
    expect(mobilityCheckbox).not.toBeChecked();

    await user.click(mobilityCheckbox);
    expect(mobilityCheckbox).toBeChecked();

    await user.click(mobilityCheckbox);
    expect(mobilityCheckbox).not.toBeChecked();
  });

  it("allows editing transport notes", async () => {
    const user = userEvent.setup();
    render(
      <AccessibilityProfileFormRefactored
        initial={{
          mobilityNeeds: [],
          communicationPreferences: [],
          transportRequirements: {},
          digitalPreferences: {},
        }}
      />
    );

    const textarea = screen.getByPlaceholderText(
      /Any additional information/i
    );
    expect(textarea).toHaveValue("");

    await user.type(textarea, "Test pickup notes");
    expect(textarea).toHaveValue("Test pickup notes");
  });

  it("submits form with all preferences", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    global.fetch = mockFetch;

    render(
      <AccessibilityProfileFormRefactored
        initial={{
          mobilityNeeds: ["manual_wheelchair"],
          communicationPreferences: ["sms"],
          transportRequirements: {
            requiresWheelchairAccessibleVehicle: true,
          },
          digitalPreferences: {
            largeText: true,
          },
        }}
      />
    );

    const submitButton = screen.getByRole("button", {
      name: /Save accessibility preferences/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/accessibility-profile",
        expect.objectContaining({
          method: "PATCH",
        })
      );
    });

    const callBody = JSON.parse(
      (mockFetch.mock.calls[0] as unknown[])[1].body as string
    );
    expect(callBody.mobilityNeeds).toContain("manual_wheelchair");
    expect(callBody.communicationPreferences).toContain("sms");
    expect(callBody.transportRequirements.requiresWheelchairAccessibleVehicle).toBe(
      true
    );
  });

  it("displays success message on successful submit", async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as never);

    render(
      <AccessibilityProfileFormRefactored
        initial={{
          mobilityNeeds: [],
          communicationPreferences: [],
          transportRequirements: {},
          digitalPreferences: {},
        }}
      />
    );

    expect(screen.queryByRole("status")).not.toHaveTextContent(
      /saved successfully/i
    );

    const submitButton = screen.getByRole("button", {
      name: /Save accessibility preferences/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      const statusRegion = screen.getByRole("status");
      expect(statusRegion).toHaveTextContent(/saved successfully/i);
    });
  });

  it("displays error message on failed submit", async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: "Validation failed" }),
    } as never);

    render(
      <AccessibilityProfileFormRefactored
        initial={{
          mobilityNeeds: [],
          communicationPreferences: [],
          transportRequirements: {},
          digitalPreferences: {},
        }}
      />
    );

    const submitButton = screen.getByRole("button", {
      name: /Save accessibility preferences/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      const statusRegion = screen.getByRole("status");
      expect(statusRegion).toHaveTextContent(/Could not save/i);
    });
  });

  it("shows auth error for 401 response", async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: "Unauthorized" }),
    } as never);

    render(
      <AccessibilityProfileFormRefactored
        initial={{
          mobilityNeeds: [],
          communicationPreferences: [],
          transportRequirements: {},
          digitalPreferences: {},
        }}
      />
    );

    const submitButton = screen.getByRole("button", {
      name: /Save accessibility preferences/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      const statusRegion = screen.getByRole("status");
      expect(statusRegion).toHaveTextContent(/must be signed in/i);
    });
  });

  it("disables submit button while loading", async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ ok: true } as never), 100)
        )
    );

    render(
      <AccessibilityProfileFormRefactored
        initial={{
          mobilityNeeds: [],
          communicationPreferences: [],
          transportRequirements: {},
          digitalPreferences: {},
        }}
      />
    );

    const submitButton = screen.getByRole("button", {
      name: /Save accessibility preferences/i,
    });
    expect(submitButton).not.toBeDisabled();

    await user.click(submitButton);
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it("handles network errors gracefully", async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));

    render(
      <AccessibilityProfileFormRefactored
        initial={{
          mobilityNeeds: [],
          communicationPreferences: [],
          transportRequirements: {},
          digitalPreferences: {},
        }}
      />
    );

    const submitButton = screen.getByRole("button", {
      name: /Save accessibility preferences/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      const statusRegion = screen.getByRole("status");
      expect(statusRegion).toHaveTextContent(/Network error/i);
    });
  });

  it("has proper ARIA labels on all checkboxes", () => {
    render(
      <AccessibilityProfileFormRefactored
        initial={{
          mobilityNeeds: [],
          communicationPreferences: [],
          transportRequirements: {},
          digitalPreferences: {},
        }}
      />
    );

    const checkboxes = screen.getAllByRole("checkbox");
    checkboxes.forEach((checkbox) => {
      expect(checkbox).toHaveAttribute("aria-label");
    });
  });

  it("has proper ARIA labels on form fields", () => {
    render(
      <AccessibilityProfileFormRefactored
        initial={{
          mobilityNeeds: [],
          communicationPreferences: [],
          transportRequirements: {},
          digitalPreferences: {},
        }}
      />
    );

    const pickupNotesTextarea = screen.getByPlaceholderText(
      /Any additional information/i
    );
    expect(pickupNotesTextarea).toHaveAttribute("aria-describedby");
  });

  it("renders legend for fieldsets (screen reader helper)", () => {
    const { container } = render(
      <AccessibilityProfileFormRefactored
        initial={{
          mobilityNeeds: [],
          communicationPreferences: [],
          transportRequirements: {},
          digitalPreferences: {},
        }}
      />
    );

    const legends = container.querySelectorAll("legend");
    expect(legends.length).toBeGreaterThan(0);
    // Verify legends are sr-only (screen reader only)
    legends.forEach((legend) => {
      expect(legend).toHaveClass("sr-only");
    });
  });

  it("maintains form state across interactions", async () => {
    const user = userEvent.setup();
    render(
      <AccessibilityProfileFormRefactored
        initial={{
          mobilityNeeds: ["manual_wheelchair"],
          communicationPreferences: [],
          transportRequirements: {},
          digitalPreferences: {},
        }}
      />
    );

    const wheelchairCheckbox = screen.getByRole("checkbox", {
      name: /manual wheelchair/i,
    });
    expect(wheelchairCheckbox).toBeChecked();

    const smsCheckbox = screen.getByRole("checkbox", {
      name: /SMS/i,
    });
    expect(smsCheckbox).not.toBeChecked();

    await user.click(smsCheckbox);
    expect(smsCheckbox).toBeChecked();

    // Original state should still be there
    expect(wheelchairCheckbox).toBeChecked();
  });

  it("has transition styles applied (motion preferences)", () => {
    const { container } = render(
      <AccessibilityProfileFormRefactored
        initial={{
          mobilityNeeds: [],
          communicationPreferences: [],
          transportRequirements: {},
          digitalPreferences: {},
        }}
      />
    );

    // Check that transition-colors class exists on labels
    const labels = container.querySelectorAll("label");
    const hasTransitions = Array.from(labels).some((label) =>
      label.className.includes("transition")
    );
    expect(hasTransitions).toBe(true);
  });
});
