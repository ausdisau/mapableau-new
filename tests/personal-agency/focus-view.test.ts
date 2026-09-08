import { describe, expect, it } from "vitest";

import {
  projectFocusView,
  visibleFocusSections,
  type FocusViewItem,
} from "@/lib/personal-agency/focus-view";

describe("projectFocusView", () => {
  const now = new Date("2026-09-08T09:00:00+10:00");

  const items: FocusViewItem[] = [
    {
      id: "later",
      source: "schedule",
      title: "Physio",
      at: new Date("2026-09-08T11:00:00+10:00"),
      status: "confirmed",
    },
    {
      id: "next",
      source: "transport",
      title: "Accessible transport",
      at: new Date("2026-09-08T10:00:00+10:00"),
      status: "confirmed",
    },
    {
      id: "past",
      source: "schedule",
      title: "Breakfast",
      at: new Date("2026-09-08T08:00:00+10:00"),
      status: "completed",
    },
  ];

  it("projects the next upcoming item as now without inventing duration", () => {
    const projection = projectFocusView(items, now);

    expect(projection.now?.id).toBe("next");
    expect(projection.next?.id).toBe("later");
    expect(projection.later).toHaveLength(0);
  });

  it("prioritises an explicitly active item", () => {
    const projection = projectFocusView(
      [
        ...items,
        {
          id: "active",
          source: "care",
          title: "Morning support",
          at: new Date("2026-09-08T08:30:00+10:00"),
          status: "in_progress",
        },
      ],
      now,
    );

    expect(projection.now?.id).toBe("active");
    expect(projection.next?.id).toBe("next");
  });

  it("returns no current item when the day is complete", () => {
    const projection = projectFocusView(
      [
        {
          id: "done",
          source: "schedule",
          title: "Done",
          at: new Date("2026-09-08T08:00:00+10:00"),
          status: "completed",
        },
      ],
      now,
    );

    expect(projection).toEqual({ now: null, next: null, later: [] });
  });
});

describe("visibleFocusSections", () => {
  it("keeps simpler mode to one item", () => {
    expect(visibleFocusSections("simpler")).toEqual({
      showNext: false,
      showLater: false,
    });
  });

  it("shows next in standard mode and later in detailed mode", () => {
    expect(visibleFocusSections("standard")).toEqual({
      showNext: true,
      showLater: false,
    });
    expect(visibleFocusSections("detailed")).toEqual({
      showNext: true,
      showLater: true,
    });
  });
});
