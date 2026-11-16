/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { ChatFirstFilterChips } from "@/components/provider-finder/ChatFirstFilterChips";
import { ChatFirstFinderExperience } from "@/components/provider-finder/ChatFirstFinderExperience";
import { ChatFirstNoResults } from "@/components/provider-finder/ChatFirstNoResults";
import {
  isProviderFinderChatFirstV2Enabled,
  shouldRevealChatFirstResults,
} from "@/lib/config/provider-finder-chat-first";
import { clearAppliedField } from "@/lib/provider/finder/merge-applied";
import type { AppliedSearchFields } from "@/lib/search/apply-interpretation";

afterEach(() => {
  cleanup();
});

const applied: AppliedSearchFields = {
  query: "morning daily activities around Penrith",
  location: "Penrith 2750",
  providerName: "",
  serviceQuery: "morning daily activities",
  accessQuery: "text communication",
  supportType: "personal-care",
  accessNeedIds: ["text-communication"],
};

describe("chat-first provider finder v2", () => {
  it("keeps the preview flag fail-closed unless env is exactly true", () => {
    expect(isProviderFinderChatFirstV2Enabled({})).toBe(false);
    expect(
      isProviderFinderChatFirstV2Enabled({
        MAPABLE_PROVIDER_FINDER_CHAT_FIRST_V2_ENABLED: "false",
      }),
    ).toBe(false);
    expect(
      isProviderFinderChatFirstV2Enabled({
        MAPABLE_PROVIDER_FINDER_CHAT_FIRST_V2_ENABLED: "TRUE",
      }),
    ).toBe(false);
    expect(
      isProviderFinderChatFirstV2Enabled({
        MAPABLE_PROVIDER_FINDER_CHAT_FIRST_V2_ENABLED: "true",
      }),
    ).toBe(true);
  });

  it("exposes Chat / Results / Map tab roles and keeps chat mounted", () => {
    render(
      <ChatFirstFinderExperience
        searchSubmitted
        hasMatches
        chat={<div data-testid="chat-slot">Chat remains mounted</div>}
        list={<div data-testid="list-slot">Results list</div>}
        map={<div data-testid="map-slot">Optional map</div>}
      />,
    );

    const tablist = screen.getByRole("tablist", { name: "Provider finder views" });
    expect(tablist).toBeTruthy();
    expect(screen.getAllByRole("tab")).toHaveLength(3);

    fireEvent.click(screen.getByRole("tab", { name: "Results" }));
    expect(screen.getByTestId("chat-slot")).toBeTruthy();
    expect(screen.getAllByTestId("list-slot").length).toBeGreaterThan(0);
    expect(screen.queryByTestId("map-slot")).toBeNull();

    fireEvent.click(screen.getByRole("tab", { name: "Map" }));
    expect(screen.getByTestId("chat-slot")).toBeTruthy();
    expect(screen.getAllByTestId("map-slot").length).toBeGreaterThan(0);
  });

  it("does not reveal results during clarification turns", () => {
    expect(shouldRevealChatFirstResults("needs_clarification")).toBe(false);
    expect(shouldRevealChatFirstResults(undefined)).toBe(false);
    expect(shouldRevealChatFirstResults("complete")).toBe(true);
  });

  it("offers no-results actions without automated reportability", () => {
    const onViewDirectory = vi.fn();
    render(
      <ChatFirstNoResults
        applied={applied}
        onEditSearch={() => undefined}
        onBroadenSearch={() => undefined}
        onViewDirectory={onViewDirectory}
      />,
    );

    expect(screen.getByRole("button", { name: "Edit my search" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Broaden search" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "View directory" }));
    expect(onViewDirectory).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("link", { name: "Ask for human support" }),
    ).toBeTruthy();
    expect(screen.getByText(/does not decide reportability/i)).toBeTruthy();
  });

  it("removes one chip without wiping other applied fields", () => {
    const next = clearAppliedField(applied, "location");
    expect(next.location).toBe("");
    expect(next.serviceQuery).toBe("morning daily activities");
    expect(next.accessQuery).toBe("text communication");
    expect(next.accessNeedIds).toEqual(["text-communication"]);

    const onRemove = (key: "location") => key;
    render(
      <ChatFirstFilterChips
        applied={applied}
        onEdit={() => undefined}
        onRemove={(key) => {
          expect(key).toBe("location");
          onRemove("location");
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove Area filter" }));
  });
});
