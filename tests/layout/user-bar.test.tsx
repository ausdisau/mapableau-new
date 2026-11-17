/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { signIn } from "next-auth/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  accountMenuDialogStyle,
  MapAbleUserBar,
} from "@/components/layout/MapAbleUserBar";

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
  window.history.replaceState(null, "", "/");
  vi.mocked(signIn).mockReset();
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
    expect(screen.queryByText("Password sign-in")).toBeNull();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
    expect(screen.queryByRole("textbox", { name: /email/i })).toBeNull();
  });

  it("does not label OAuth or other non-step-up sessions as password sign-ins", async () => {
    sessionState.status = "authenticated";
    sessionState.data = {
      user: {
        id: "user-2",
        name: "Alex OAuth",
        email: "alex@example.com",
        role: "participant",
      },
    };
    const user = userEvent.setup();
    render(<MapAbleUserBar />);

    await user.click(
      screen.getByRole("button", {
        name: "Account menu, signed in as Alex OAuth",
      }),
    );

    expect(screen.getByText("Signed in without extra verification")).toBeTruthy();
    expect(screen.queryByText("Password sign-in")).toBeNull();
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

  it("keeps the current search parameters in the post-login callback", async () => {
    sessionState.pathname = "/provider-finder";
    window.history.replaceState(
      null,
      "",
      "/provider-finder?q=therapy&location=Sydney",
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/auth/twilio-2fa/start")) {
          return {
            ok: true,
            json: async () => ({ required: false }),
          };
        }
        return {
          ok: true,
          json: async () => ({}),
        };
      }),
    );

    const user = userEvent.setup();
    render(<MapAbleUserBar />);
    await user.click(screen.getByTestId("mapable-user-bar-trigger"));
    await user.type(
      screen.getByRole("textbox", { name: /email/i }),
      "jane@example.com",
    );
    await user.type(screen.getByLabelText(/password/i), "secret-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith(
        "credentials",
        expect.objectContaining({
          callbackUrl: "/provider-finder?q=therapy&location=Sydney",
        }),
      );
    });
  });

  it("portals the dialog to document.body so sticky headers cannot clip it", async () => {
    const user = userEvent.setup();
    render(<MapAbleUserBar />);
    await user.click(screen.getByTestId("mapable-user-bar-trigger"));

    const dialog = screen.getByRole("dialog", { name: "Sign in" });
    const overlay = screen.getByRole("button", { name: "Close account menu" });
    expect(dialog.parentElement).toBe(document.body);
    expect(overlay.parentElement).toBe(document.body);
    expect(overlay.className).toContain("inset-0");
    expect(
      screen.getByTestId("mapable-user-bar").contains(dialog),
    ).toBe(false);
  });
});

describe("accountMenuDialogStyle", () => {
  it("keeps the dialog inside a 320px viewport when the avatar is not at the right edge", () => {
    const style = accountMenuDialogStyle(
      { bottom: 56, right: 240 },
      { width: 320, height: 568 },
    );
    const left = Number(style.left);
    const width = Number(style.width);
    expect(width).toBe(296);
    expect(left).toBe(12);
    expect(left + width).toBeLessThanOrEqual(308);
  });

  it("aligns to the avatar on a wide viewport", () => {
    const style = accountMenuDialogStyle(
      { bottom: 56, right: 1268 },
      { width: 1280, height: 800 },
    );
    expect(style.width).toBe(384);
    expect(style.left).toBe(884);
  });
});
