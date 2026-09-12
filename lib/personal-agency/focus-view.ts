export type FocusViewDensity = "simpler" | "standard" | "detailed";

export type FocusViewSource = "care" | "transport" | "schedule";

export type FocusViewItem = {
  id: string;
  source: FocusViewSource;
  title: string;
  at: Date;
  status?: string;
  href?: string;
};

export type FocusViewProjection = {
  primary: FocusViewItem | null;
  primaryState: "active" | "upcoming" | null;
  secondary: FocusViewItem | null;
  later: FocusViewItem[];
};

const ACTIVE_STATUSES = new Set(["in_progress", "arrived", "boarding"]);

/**
 * Deterministic presentation projection over already-authorised schedule data.
 * No model involvement, ranking, service selection or operational execution.
 */
export function projectFocusView(
  items: FocusViewItem[],
  now: Date,
): FocusViewProjection {
  const ordered = [...items].sort((a, b) => a.at.getTime() - b.at.getTime());

  const activeIndex = ordered.findIndex((item) =>
    item.status ? ACTIVE_STATUSES.has(item.status) : false,
  );
  const primaryIndex =
    activeIndex >= 0
      ? activeIndex
      : ordered.findIndex((item) => item.at.getTime() >= now.getTime());

  if (primaryIndex < 0) {
    return {
      primary: null,
      primaryState: null,
      secondary: null,
      later: [],
    };
  }

  return {
    primary: ordered[primaryIndex] ?? null,
    primaryState: activeIndex >= 0 ? "active" : "upcoming",
    secondary: ordered[primaryIndex + 1] ?? null,
    later: ordered.slice(primaryIndex + 2),
  };
}

export function visibleFocusSections(density: FocusViewDensity): {
  showSecondary: boolean;
  showLater: boolean;
} {
  if (density === "simpler") {
    return { showSecondary: false, showLater: false };
  }
  if (density === "detailed") {
    return { showSecondary: true, showLater: true };
  }
  return { showSecondary: true, showLater: false };
}
