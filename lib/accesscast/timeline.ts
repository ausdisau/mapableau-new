import type { AccessCastTimelineItem } from "./types";

export type TimelineHint = {
  offsetMinutes: number;
  label: string;
  kind: AccessCastTimelineItem["kind"];
  relatedSegmentId?: string | null;
};

/**
 * Text-first forecast timeline. The structured list is authoritative;
 * graphical timelines are optional presentation only.
 */
export function buildAccessCastTimeline(
  intendedJourneyTime: string,
  hints: TimelineHint[],
): AccessCastTimelineItem[] {
  const base = new Date(intendedJourneyTime).getTime();
  return hints.map((h, i) => ({
    id: `tl-${i}-${h.kind}`,
    at: new Date(base + h.offsetMinutes * 60 * 1000).toISOString(),
    label: h.label,
    kind: h.kind,
    relatedSegmentId: h.relatedSegmentId ?? null,
  }));
}

/** Starting Work tomorrow — Taylor @ Harbour Civic Centre Room 3.12. */
export const STARTING_WORK_TIMELINE_HINTS: TimelineHint[] = [
  {
    offsetMinutes: -60,
    label: "Accessible vehicle confirmation due",
    kind: "confirmation_due",
    relatedSegmentId: "seg-transport",
  },
  {
    offsetMinutes: -30,
    label: "Construction scheduled near northern entrance",
    kind: "scheduled_change",
    relatedSegmentId: "seg-entrance",
  },
  {
    offsetMinutes: -15,
    label: "Recommended departure buffer begins",
    kind: "recovery_buffer",
  },
  {
    offsetMinutes: 0,
    label: "Journey start",
    kind: "journey_start",
  },
  {
    offsetMinutes: 40,
    label: "Expected arrival at Harbour Civic Centre",
    kind: "expected_arrival",
    relatedSegmentId: "seg-room",
  },
  {
    offsetMinutes: 60,
    label: "Workplace induction — Room 3.12",
    kind: "appointment",
    relatedSegmentId: "seg-room",
  },
  {
    offsetMinutes: 210,
    label: "Return-transport confirmation due",
    kind: "return_confirmation",
    relatedSegmentId: "seg-return",
  },
];

/** Format timeline for print / Easy Read-ready plain text. */
export function formatTimelinePlainText(
  items: AccessCastTimelineItem[],
  timeZone = "Australia/Sydney",
): string {
  return items
    .map((item) => {
      const time = new Date(item.at).toLocaleTimeString("en-AU", {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      return `${time}\n${item.label}`;
    })
    .join("\n\n");
}
