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
  now: FocusViewItem | null;
  next: FocusViewItem | null;
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
  const currentIndex =
    activeIndex >= 0
      ? activeIndex
      : ordered.findIndex((item) => item.at.getTime() >= now.getTime());

  if (currentIndex < 0) {
    return { now: null, next: null, later: [] };
  }

  return {
    now: ordered[currentIndex] ?? null,
    next: ordered[currentIndex + 1] ?? null,
    later: ordered.slice(currentIndex + 2),
  };
}

export function visibleFocusSections(density: FocusViewDensity): {
  showNext: boolean;
  showLater: boolean;
} {
  if (density === "simpler") {
    return { showNext: false, showLater: false };
  }
  if (density === "detailed") {
    return { showNext: true, showLater: true };
  }
  return { showNext: true, showLater: false };
}
