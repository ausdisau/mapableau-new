/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { FocusView } from "@/components/personal-agency/FocusView";
import type { FocusViewProjection } from "@/lib/personal-agency/focus-view";

afterEach(() => {
  cleanup();
});

const upcomingProjection: FocusViewProjection = {
  primary: {
    id: "trip-1",
    source: "transport",
    title: "Accessible transport",
    at: new Date("2026-09-08T10:00:00+10:00"),
    status: "confirmed",
  },
  primaryState: "upcoming",
  secondary: {
    id: "appointment-1",
    source: "schedule",
    title: "Physio",
    at: new Date("2026-09-08T11:00:00+10:00"),
    status: "confirmed",
  },
  later: [
    {
      id: "lunch-1",
      source: "schedule",
      title: "Lunch",
      at: new Date("2026-09-08T12:30:00+10:00"),
    },
  ],
};

describe("FocusView", () => {
  it("labels a future primary item as Next rather than Now", () => {
    render(<FocusView projection={upcomingProjection} density="standard" />);

    expect(screen.getByText("Next")).toBeTruthy();
    expect(screen.queryByText("Now")).toBeNull();
    expect(screen.getByText("After that")).toBeTruthy();
  });

  it("keeps human help available in simpler mode while reducing information", () => {
    render(<FocusView projection={upcomingProjection} density="simpler" />);

    expect(screen.getByText("Accessible transport")).toBeTruthy();
    expect(screen.queryByText("Physio")).toBeNull();
    expect(screen.queryByText("Lunch")).toBeNull();
    expect(screen.getByRole("link", { name: /talk to a person/i })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /plan or change something/i }),
    ).toBeTruthy();
  });

  it("shows later items only when the participant asks for more detail", () => {
    render(<FocusView projection={upcomingProjection} density="detailed" />);

    expect(screen.getByText("Accessible transport")).toBeTruthy();
    expect(screen.getByText("Physio")).toBeTruthy();
    expect(screen.getByText("Lunch")).toBeTruthy();
  });
});
