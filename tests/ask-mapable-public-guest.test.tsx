/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isPublicAccessAssistantRoute } from "@/lib/ask-mapable/public-guest-policy";

vi.mock("next-auth/react", () => ({
  useSession: () => ({ status: "unauthenticated", data: null }),
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
    isAskMapAbleEmbeddedEnabled: () => false,
    isAskMapAbleGuestEnabled: () => true,
  };
});

vi.mock("@/components/guided-search/GuidedSearchDialogue", () => ({
  GuidedSearchDialogue: () => <p data-testid="guest-guided-search">Public guided search</p>,
}));

import { AskMapAbleWidget } from "@/components/ask-mapable/AskMapAbleWidget";

describe("MapAble public Access Assistant", () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => cleanup());

  it("presents one launcher with a no-AI guide as the default", async () => {
    const user = userEvent.setup();
    render(<AskMapAbleWidget />);
    expect(screen.getAllByTestId("ask-mapable-launcher")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Open Ask MapAble" }));

    expect(screen.getByRole("heading", { name: "Guided discovery, without AI" })).toBeTruthy();
    expect(screen.queryByTestId("guest-guided-search")).toBeNull();
    expect(screen.queryByRole("tab", { name: "History" })).toBeNull();

    await user.click(screen.getByRole("tab", { name: "Actions" }));
    expect(screen.getByRole("link", { name: /Talk to a person/i }).getAttribute("href"))
      .toBe("/contact");
    expect(screen.queryByText(/create transport request/i)).toBeNull();
  });

  it("does not mount the public AI chat until the visitor explicitly opts in", async () => {
    const user = userEvent.setup();
    render(<AskMapAbleWidget />);
    await user.click(screen.getByRole("button", { name: "Open Ask MapAble" }));
    await user.click(screen.getByRole("button", { name: "Ask a question" }));
    expect(screen.queryByTestId("guest-guided-search")).toBeNull();
    const consent = screen.getByRole("checkbox", { name: /I choose to use the online conversational search/i });
    await user.click(consent);
    expect(screen.getByTestId("guest-guided-search")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Guided steps (no AI)" }));
    expect(screen.queryByTestId("guest-guided-search")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Ask a question" }));
    expect((screen.getByRole("checkbox", { name: /I choose to use the online conversational search/i }) as HTMLInputElement).checked).toBe(false);
    expect(screen.queryByTestId("guest-guided-search")).toBeNull();
  });

  it("closes on Escape without a second launcher", async () => {
    const user = userEvent.setup();
    render(<AskMapAbleWidget />);
    await user.click(screen.getByRole("button", { name: "Open Ask MapAble" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getAllByTestId("ask-mapable-launcher")).toHaveLength(1);
  });
});

describe("Guest assistant gates", () => {
  it("accepts only public discoverable routes", () => {
    for (const path of ["/", "/access", "/provider-finder/sydney", "/care", "/transport", "/employment"]) {
      expect(isPublicAccessAssistantRoute(path)).toBe(true);
    }
    for (const path of ["/dashboard", "/participant/jobs", "/my/home", "/billing", "/admin", "/login"]) {
      expect(isPublicAccessAssistantRoute(path)).toBe(false);
    }
  });

  it("keeps authenticated and guest flags separate and default-off", async () => {
    const actual = await vi.importActual<typeof import("@/lib/ask-mapable/flags")>(
      "@/lib/ask-mapable/flags",
    );
    expect(actual.isAskMapAbleGuestEnabled({})).toBe(false);
    expect(actual.isAskMapAbleEmbeddedEnabled({})).toBe(false);
    expect(actual.isAskMapAbleGuestEnabled({
      NEXT_PUBLIC_MAPABLE_PUBLIC_ACCESS_ASSISTANT_ENABLED: "true",
    })).toBe(true);
    expect(actual.isAskMapAbleEmbeddedEnabled({
      NEXT_PUBLIC_ASK_MAPABLE_EMBEDDED_ENABLED: "true",
    })).toBe(true);
  });
});
