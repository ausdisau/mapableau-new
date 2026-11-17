/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MapAbleUserBar } from "@/components/layout/MapAbleUserBar";

const sessionState = vi.hoisted(() => ({
  status: "unauthenticated" as "authenticated" | "unauthenticated" | "loading",
  data: null as null | {
    user: {
      id: string;
      name: string;
      email: string;
      role?: string;
      mfaVerified?: boolean;
      image?: string | null;
    };
  },
  pathname: "/",
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ status: sessionState.status, data: sessionState.data }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => sessionState.pathname,
  useSearchParams: () => new URLSearchParams(),
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

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  sessionState.status = "unauthenticated";
  sessionState.data = null;
  sessionState.pathname = "/";
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }),
  );
});

describe("MapAbleUserBar", () => {
  it("opens a nested sign-in form when signed out", async () => {
    const user = userEvent.setup();
    render(<MapAbleUserBar />);

    const trigger = screen.getByTestId("mapable-user-bar-trigger");
    expect(trigger.getAttribute("aria-label")).toBe(
      "Account menu, not signed in",
    );
    expect(trigger.className).toContain("min-h-11");
    expect(trigger.className).toContain("min-w-11");

    await user.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Sign in" });
    expect(dialog).toBeTruthy();
    expect(screen.getByRole("textbox", { name: /email/i })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Sign in" }),
    ).toBeTruthy();
  });

  it("shows account details and hides the form when signed in", async () => {
    sessionState.status = "authenticated";
    sessionState.data = {
      user: {
        id: "user-1",
        name: "Jane Citizen",
        email: "jane@example.com",
        role: "participant",
        mfaVerified: true,
      },
    };
    const user = userEvent.setup();
    render(<MapAbleUserBar />);

    const trigger = screen.getByRole("button", {
      name: "Account menu, signed in as Jane Citizen",
    });
    await user.click(trigger);

    expect(screen.getByRole("dialog", { name: "Your account" })).toBeTruthy();
    expect(screen.getByText("Jane Citizen")).toBeTruthy();
    expect(screen.getByText("jane@example.com")).toBeTruthy();
    expect(screen.getByText("Participant")).toBeTruthy();
    expect(screen.getByText("Signed in with extra verification")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
    expect(screen.queryByRole("textbox", { name: /email/i })).toBeNull();
  });

  it("does not nest a second form on the login page", async () => {
    sessionState.pathname = "/login";
    const user = userEvent.setup();
    render(<MapAbleUserBar />);

    await user.click(screen.getByTestId("mapable-user-bar-trigger"));

    expect(screen.getByRole("dialog", { name: "Sign in" })).toBeTruthy();
    expect(
      screen.getByText("Use the form on this page to sign in or create an account."),
    ).toBeTruthy();
    expect(screen.queryByRole("textbox", { name: /email/i })).toBeNull();
  });
});
