/**
 * MapAble Places: local-only, privacy-first demonstration domain.
 *
 * No action implies real attendance, published review, verified access,
 * CripSquare group membership, server submission or location tracking.
 * Keep personally identifying details and clinical records out of this demo.
 */
export type EvidenceStatus = "documented" | "conditional" | "unknown";
export type AccessFeature = { status: EvidenceStatus; detail: string };
export type Place = {
  id: string;
  name: string;
  suburb: string;
  category: string;
  description: string;
  source: "illustrative" | "mapable-directory";
  sourceLabel: string;
  sourceReviewedAt?: string;
  sourceUrl?: string;
  stepFree: AccessFeature;
  accessibleToilet: AccessFeature;
  caution: string;
};
export type SavedPlace = Pick<Place, "id" | "name" | "suburb"> & {
  savedAt: string;
};
export type PlaceMemory = {
  id: string;
  placeId: string;
  placeName: string;
  note: string;
  updatedAt: string;
  audience: "private";
};
export type FeatureType = "entrance" | "toilets" | "communication" | "sensory" | "transport";
export type ObservationOutcome = "usable" | "barrier" | "unsure";
export type ObservationSource = "personal-observation" | "venue-information" | "other";
export type ObservationStatus = "draft" | "prepared-for-review";
export type AccessReport = {
  id: string;
  placeId: string;
  placeName: string;
  feature: FeatureType;
  outcome: ObservationOutcome;
  description: string;
  observedOn: string;
  sourceType: ObservationSource;
  status: ObservationStatus;
  updatedAt: string;
};
export type CommunityPost = {
  id: string;
  circleId: string;
  circleTitle: string;
  title: string;
  body: string;
  status: "draft" | "prepared-for-review";
  updatedAt: string;
};
export type PlacesState = {
  version: 1;
  savedPlaces: SavedPlace[];
  memories: PlaceMemory[];
  reports: AccessReport[];
  interestEventIds: string[];
  joinedCircleIds: string[];
  posts: CommunityPost[];
};
export type PlacesAction =
  | { type: "toggle-saved"; place: Place; at: string }
  | { type: "remove-saved"; id: string }
  | { type: "toggle-circle"; circleId: string }
  | { type: "save-memory"; memory: PlaceMemory }
  | { type: "delete-memory"; id: string }
  | { type: "save-report"; report: AccessReport }
  | { type: "prepare-report"; id: string }
  | { type: "delete-report"; id: string }
  | { type: "toggle-interest"; eventId: string }
  | { type: "save-post"; post: CommunityPost }
  | { type: "prepare-post"; id: string }
  | { type: "delete-post"; id: string }
  | { type: "reset" };

export const initialPlacesState: PlacesState = {
  version: 1,
  savedPlaces: [],
  memories: [],
  reports: [],
  interestEventIds: [],
  joinedCircleIds: [],
  posts: [],
};

function upsert<T extends { id: string }>(items: T[], value: T): T[] {
  return [value, ...items.filter((item) => item.id !== value.id)].slice(0, 100);
}

export function reducePlacesState(state: PlacesState, action: PlacesAction): PlacesState {
  switch (action.type) {
    case "toggle-saved": {
      if (state.savedPlaces.some((saved) => saved.id === action.place.id)) {
        return { ...state, savedPlaces: state.savedPlaces.filter((p) => p.id !== action.place.id) };
      }
      const saved: SavedPlace = {
        id: action.place.id, name: action.place.name, suburb: action.place.suburb, savedAt: action.at,
      };
      return { ...state, savedPlaces: upsert(state.savedPlaces, saved) };
    }
    case "remove-saved":
      return { ...state, savedPlaces: state.savedPlaces.filter((saved) => saved.id !== action.id) };
    case "toggle-circle":
      return { ...state, joinedCircleIds: state.joinedCircleIds.includes(action.circleId)
        ? state.joinedCircleIds.filter((id) => id !== action.circleId)
        : [...state.joinedCircleIds, action.circleId].slice(0,100) };
    case "save-memory":
      if (!action.memory.note.trim()) return state;
      return { ...state, memories: upsert(state.memories, { ...action.memory, audience: "private" }) };
    case "delete-memory":
      return { ...state, memories: state.memories.filter((m) => m.id !== action.id) };
    case "save-report":
      if (validateReport(action.report).length) return state;
      return { ...state, reports: upsert(state.reports, { ...action.report, status: "draft" }) };
    case "prepare-report":
      return { ...state, reports: state.reports.map((r) => r.id === action.id ? { ...r, status: "prepared-for-review" } : r) };
    case "delete-report":
      return { ...state, reports: state.reports.filter((r) => r.id !== action.id) };
    case "toggle-interest":
      return {
        ...state,
        interestEventIds: state.interestEventIds.includes(action.eventId)
          ? state.interestEventIds.filter((id) => id !== action.eventId)
          : [...state.interestEventIds, action.eventId].slice(0, 100),
      };
    case "save-post":
      if (validatePost(action.post).length) return state;
      return { ...state, posts: upsert(state.posts, { ...action.post, status: "draft" }) };
    case "prepare-post":
      return { ...state, posts: state.posts.map((post) => post.id === action.id
        ? { ...post, status: "prepared-for-review" }
        : post) };
    case "delete-post":
      return { ...state, posts: state.posts.filter((post) => post.id !== action.id) };
    case "reset":
      return { ...initialPlacesState };
  }
}

export function validateReport(report: Partial<AccessReport>, today?: string): string[] {
  const errors: string[] = [];
  if (!report.placeId || !report.placeName) errors.push("Choose a place.");
  if (!["entrance", "toilets", "communication", "sensory", "transport"].includes(report.feature ?? ""))
    errors.push("Choose the access feature you're describing.");
  if (!["usable", "barrier", "unsure"].includes(report.outcome ?? ""))
    errors.push("Choose whether the feature was usable, presented a barrier or was uncertain.");
  if (!["personal-observation", "venue-information", "other"].includes(report.sourceType ?? ""))
    errors.push("Describe how you obtained the information.");
  if (!report.observedOn || !/^\d{4}-\d{2}-\d{2}$/.test(report.observedOn) ||
      !Number.isFinite(Date.parse(report.observedOn + "T12:00:00Z")) ||
      new Date(report.observedOn + "T12:00:00Z").toISOString().slice(0, 10) !== report.observedOn)
    errors.push("Enter a valid observation date as YYYY-MM-DD.");
  else if (report.observedOn > (today ?? new Date().toISOString().slice(0, 10)))
    errors.push("The observation date cannot be in the future.");
  const description = report.description?.trim() ?? "";
  if (description.length < 25)
    errors.push("Add at least 25 characters describing the access conditions and any uncertainty.");
  if (description.length > 1200) errors.push("Keep the description under 1,200 characters.");
  return errors;
}

export function validatePost(post: Partial<CommunityPost>): string[] {
  const errors: string[] = [];
  if (!post.circleId || !post.circleTitle) errors.push("Choose the CripSquare community.");
  if ((post.title?.trim().length ?? 0) < 5 || (post.title?.length ?? 0) > 120)
    errors.push("Give your post a descriptive title between 5 and 120 characters.");
  if ((post.body?.trim().length ?? 0) < 20 || (post.body?.length ?? 0) > 2000)
    errors.push("Write 20–2,000 characters so the post makes sense without images.");
  return errors;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isText = (value: unknown, max: number): value is string =>
  typeof value === "string" && value.length <= max && value.length > 0;
const isDate = (value: unknown): value is string =>
  typeof value === "string" && !Number.isNaN(Date.parse(value));

/** Fail closed on corrupted or unexpected local state; never execute saved content. */
export function parseSavedState(raw: unknown): PlacesState | null {
  if (!isObject(raw) || raw.version !== 1 ||
    !Array.isArray(raw.savedPlaces) || !Array.isArray(raw.memories) ||
    !Array.isArray(raw.reports) || !Array.isArray(raw.posts) ||
    !Array.isArray(raw.interestEventIds) || !Array.isArray(raw.joinedCircleIds)) return null;
  if ([raw.savedPlaces, raw.memories, raw.reports, raw.posts, raw.interestEventIds, raw.joinedCircleIds]
    .some((items) => items.length > 100)) return null;
  const savedPlaces: SavedPlace[] = [];
  for (const item of raw.savedPlaces) {
    if (!isObject(item) || !isText(item.id, 150) || !isText(item.name, 170) ||
        typeof item.suburb !== "string" || item.suburb.length > 120 ||
        !isDate(item.savedAt)) return null;
    savedPlaces.push({ id: item.id, name: item.name, suburb: item.suburb, savedAt: item.savedAt });
  }
  const memories: PlaceMemory[] = [];
  for (const item of raw.memories) {
    if (!isObject(item) || !isText(item.id, 120) || !isText(item.placeId, 150) ||
        !isText(item.placeName, 170) || !isText(item.note, 2000) ||
        !isDate(item.updatedAt) || item.audience !== "private") return null;
    memories.push({
      id: item.id, placeId: item.placeId, placeName: item.placeName,
      note: item.note, updatedAt: item.updatedAt, audience: "private",
    });
  }
  const reports: AccessReport[] = [];
  for (const item of raw.reports) {
    if (!isObject(item) || !isText(item.id, 120) || !isText(item.placeId, 150) ||
        !isText(item.placeName, 170) || !isText(item.updatedAt, 50) ||
        !["draft", "prepared-for-review"].includes(String(item.status))) return null;
    const report = item as unknown as AccessReport;
    if (validateReport(report, "9999-12-31").length) return null;
    reports.push({
      id: report.id, placeId: report.placeId, placeName: report.placeName,
      feature: report.feature, outcome: report.outcome,
      description: report.description, observedOn: report.observedOn,
      sourceType: report.sourceType, status: report.status, updatedAt: report.updatedAt,
    });
  }
  const posts: CommunityPost[] = [];
  for (const item of raw.posts) {
    if (!isObject(item) || !isText(item.id, 120) || !isDate(item.updatedAt) ||
        !["draft", "prepared-for-review"].includes(String(item.status))) return null;
    const post = item as unknown as CommunityPost;
    if (validatePost(post).length) return null;
    posts.push({
      id: post.id, circleId: post.circleId, circleTitle: post.circleTitle,
      title: post.title, body: post.body, status: post.status, updatedAt: post.updatedAt,
    });
  }
  if (!raw.interestEventIds.every((id: unknown) => isText(id, 100)) ||
      !raw.joinedCircleIds.every((id: unknown) => isText(id, 100))) return null;
  return { version: 1, savedPlaces, memories, reports, posts,
    interestEventIds: [...raw.interestEventIds] as string[], joinedCircleIds: [...raw.joinedCircleIds] as string[] };
}

export function createLocalId(prefix: string): string {
  return prefix + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
}
