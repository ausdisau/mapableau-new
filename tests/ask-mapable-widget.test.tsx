/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    status: "authenticated",
    data: { user: { id: "user-1", name: "Test" } },
  }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/access",
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/ask-mapable/flags", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ask-mapable/flags")>(
    "@/lib/ask-mapable/flags",
  );
  return {
    ...actual,
    isAskMapAbleEmbeddedEnabled: () => true,
  };
});

import { AskMapAbleWidget } from "@/components/ask-mapable/AskMapAbleWidget";

describe("AskMapAbleWidget", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("exposes an accessible launcher and opens the panel", async () => {
    const user = userEvent.setup();
    render(<AskMapAbleWidget />);

    const launcher = screen.getByTestId("ask-mapable-launcher");
    expect(launcher.getAttribute("aria-expanded")).toBe("false");
    expect(launcher.getAttribute("aria-label")?.toLowerCase()).toContain(
      "open ask mapable",
    );

    await user.click(launcher);
    expect(screen.getByTestId("ask-mapable-panel")).toBeTruthy();
    expect(screen.getByRole("heading", { name: /ask mapable/i })).toBeTruthy();
    expect(
      screen.getByRole("tab", { name: /chat/i }).getAttribute("aria-selected"),
    ).toBe("true");
    expect(screen.getByText(/what would you like help with/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /talk to a person/i })).toBeTruthy();
  });

  it("closes on Escape and returns focus pathway to launcher control", async () => {
    const user = userEvent.setup();
    render(<AskMapAbleWidget />);
    const launcher = screen.getByTestId("ask-mapable-launcher");
    await user.click(launcher);
    expect(screen.getByTestId("ask-mapable-panel")).toBeTruthy();
    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("ask-mapable-panel")).toBeNull();
    expect(launcher.getAttribute("aria-expanded")).toBe("false");
  });
});
