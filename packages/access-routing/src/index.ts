/**
 * @mapable/access-routing — route summary types for partner SDK.
 */

export type RouteSegmentSummary = {
  fromLabel: string;
  toLabel: string;
  mode: "walk" | "lift" | "ramp" | "transport" | "unknown";
  stepFree: boolean | null;
  notes: string[];
};

export type AccessibleRouteSummary = {
  placeId: string;
  segments: RouteSegmentSummary[];
  blockers: string[];
  unknowns: string[];
  listAlternative: string[];
};
