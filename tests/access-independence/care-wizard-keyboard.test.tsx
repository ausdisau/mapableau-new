/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CareRequestWizard } from "@/components/care/CareRequestWizard";
import { clearLocalDraft, loadLocalDraft } from "@/lib/form-drafts/draft-storage";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ status: "unauthenticated", data: null }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("CareRequestWizard keyboard flow", () => {
  beforeEach(() => {
    clearLocalDraft("care-request-wizard");
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    cleanup();
    clearLocalDraft("care-request-wizard");
  });

  it("moves through steps with keyboard without storing care text locally", async () => {
    const user = userEvent.setup();
    render(<CareRequestWizard />);

    expect(screen.getByText(/step 1 of 3/i)).toBeTruthy();
    await user.type(screen.getByLabelText(/short title/i), "Morning support");
    await user.type(
      screen.getByLabelText(/tell us what you need/i),
      "Help with shower and breakfast on weekdays.",
    );
    await user.click(screen.getByRole("button", { name: /^continue$/i }));

    await waitFor(() => {
      expect(screen.getByText(/step 2 of 3/i)).toBeTruthy();
    });

    await user.type(screen.getByLabelText(/task 1/i), "Shower support");
    await user.click(
      screen.getByRole("button", { name: /save and continue later/i }),
    );
    await waitFor(() => screen.getByText(/draft saved|progress saved|device/i));

    const draft = loadLocalDraft("care-request-wizard");
    expect(draft?.payload.requestType).toBeTruthy();
    expect(draft?.payload.description).toBeUndefined();
    expect(draft?.payload.title).toBeUndefined();
    expect(JSON.stringify(draft)).not.toContain("Morning support");
    expect(JSON.stringify(draft)).not.toContain("Shower support");

    await user.click(screen.getByRole("button", { name: /^continue$/i }));
    await waitFor(() => {
      expect(screen.getByText(/step 3 of 3/i)).toBeTruthy();
    });

    cleanup();
    render(<CareRequestWizard />);
    await waitFor(() => {
      expect(screen.getByText(/progress restored on this device/i)).toBeTruthy();
    });
    // Sensitive free text must not be restored from localStorage for signed-out users.
    expect(
      (screen.getByLabelText(/short title/i) as HTMLInputElement).value,
    ).toBe("");
  });
});
