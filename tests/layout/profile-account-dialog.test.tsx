/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MapAbleUserBar } from "@/components/layout/MapAbleUserBar";
import { ProfileAccountDialog } from "@/components/layout/ProfileAccountDialog";

const signOut = vi.fn();

vi.mock("next-auth/react", () => ({
  signOut: (...args: unknown[]) => signOut(...args),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
  signOut.mockReset();
});

describe("ProfileAccountDialog", () => {
  it("renders name, email, role, and signed-in status", () => {
    render(
      <ProfileAccountDialog
        open
        onClose={() => undefined}
        userName="Casey Lee"
        email="casey@example.com"
        role="participant"
        avatarUrl={null}
      />
    );

    expect(screen.getByRole("dialog", { name: /account/i })).toBeTruthy();
    expect(screen.getByText("Casey Lee")).toBeTruthy();
    expect(screen.getByText("casey@example.com")).toBeTruthy();
    expect(screen.getByText("Participant")).toBeTruthy();
    expect(screen.getByText(/signed in as participant/i)).toBeTruthy();
  });

  it("hides remove picture when no avatar and upload is disabled", () => {
    render(
      <ProfileAccountDialog
        open
        onClose={() => undefined}
        userName="Casey Lee"
        email="casey@example.com"
        role="participant"
        avatarUrl={null}
        pictureActionsEnabled={false}
      />
    );

    expect(screen.queryByText(/remove profile picture/i)).toBeNull();
    expect(screen.queryByText(/change profile picture/i)).toBeNull();
  });

  it("keeps sign out available", () => {
    render(
      <ProfileAccountDialog
        open
        onClose={() => undefined}
        userName="Casey Lee"
        role="participant"
      />
    );

    expect(screen.getByRole("button", { name: /sign out/i })).toBeTruthy();
  });

  it("closes on Escape and via the close button", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { rerender } = render(
      <ProfileAccountDialog
        open
        onClose={onClose}
        userName="Casey Lee"
        role="participant"
      />
    );

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();

    onClose.mockClear();
    rerender(
      <ProfileAccountDialog
        open
        onClose={onClose}
        userName="Casey Lee"
        role="participant"
      />
    );
    await user.click(screen.getByRole("button", { name: /close account menu/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("moves focus into the dialog when opened", async () => {
    render(
      <ProfileAccountDialog
        open
        onClose={() => undefined}
        userName="Casey Lee"
        role="participant"
      />
    );

    await waitFor(() => {
      expect(document.activeElement?.textContent).toMatch(/close account menu/i);
    });
  });
});

describe("MapAbleUserBar account menu", () => {
  beforeEach(() => {
    document.body.style.overflow = "";
  });

  it("opens the dialog from the avatar button and restores focus on close", async () => {
    const user = userEvent.setup();
    render(
      <MapAbleUserBar
        userName="Casey Lee"
        email="casey@example.com"
        role="participant"
        avatarUrl={null}
      />
    );

    const trigger = screen.getByRole("button", {
      name: /open account menu for casey lee/i,
    });
    expect(trigger.getAttribute("aria-label")).toMatch(/signed in as participant/i);

    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: /account/i })).toBeTruthy();
    expect(screen.getAllByText(/signed in/i).length).toBeGreaterThan(0);

    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });

  it("exposes signed-in text on desktop and role badge", () => {
    render(
      <MapAbleUserBar
        userName="Casey Lee"
        email="casey@example.com"
        role="participant"
      />
    );

    expect(screen.getAllByText("Signed in").length).toBeGreaterThan(0);
    expect(screen.getByText("Casey Lee")).toBeTruthy();
    expect(screen.getByText("Participant")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^sign out$/i })).toBeNull();
  });
});
