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
    vi.unstubAllGlobals();
  });

  it("exposes MapAble Companion as an accessible tabbed agent", async () => {
    const user = userEvent.setup();
    render(<AskMapAbleWidget />);

    const launcher = screen.getByTestId("ask-mapable-launcher");
    expect(launcher.getAttribute("aria-expanded")).toBe("false");
    expect(launcher.getAttribute("aria-label")?.toLowerCase()).toContain(
      "open mapable companion",
    );

    await user.click(launcher);
    expect(screen.getByTestId("ask-mapable-panel")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: /mapable companion/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("tab", { name: /chat/i }).getAttribute("aria-selected"),
    ).toBe("true");
    expect(screen.getByRole("tab", { name: /actions/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /history/i })).toBeTruthy();
    expect(screen.getByText(/what would you like help with/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /talk to a person/i })).toBeTruthy();
    expect(screen.getByText(/you stay in control/i)).toBeTruthy();
  });

  it("surfaces participant-chosen interaction preferences without implying ability", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            preferences: {
              informationDensity: "simpler",
              interfaceMethods: ["AAC", "keyboard"],
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );

    const user = userEvent.setup();
    render(<AskMapAbleWidget />);
    await user.click(screen.getByTestId("ask-mapable-launcher"));

    expect(
      await screen.findByText(/using your chosen interaction preferences/i),
    ).toBeTruthy();
    expect(screen.getByText(/one thing at a time/i)).toBeTruthy();
    expect(screen.getByText(/aac/i)).toBeTruthy();
    expect(screen.getByText(/keyboard/i)).toBeTruthy();
    expect(screen.getByText(/interface preferences only/i)).toBeTruthy();
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
