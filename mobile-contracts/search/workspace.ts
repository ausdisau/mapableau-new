// Shared by the website and Expo. All clinic evidence here is fictional.
export const clinics = [
  {
    id: 1,
    name: "St Ives Allied Health Hub",
    door: 920,
    quiet: true,
    plan: true,
    approach: "120 m from the bus stop, step-free in the example.",
    hoist: "Listed",
  },
  {
    id: 2,
    name: "Ku-ring-gai Rehab Clinic",
    door: 870,
    quiet: false,
    plan: false,
    approach: "240 m from the bus stop. One kerb ramp, gradient unknown.",
    hoist: "Listed",
  },
] as const;

export type Clinic = (typeof clinics)[number];
export type ClinicId = Clinic["id"];
export const audit = "Simulated site audit · 9 November 2026";
export const exampleRequest =
  "Find a physio near St Ives with a ceiling hoist and step-free bus access.";
export const phrases = [
  "Find a clinic",
  "Step-free trip",
  "Employment information",
  "Community",
] as const;
export const views = ["List", "2D map", "3D floor plan"] as const;
export type ResultView = (typeof views)[number];
export const topics = {
  All: "/search",
  Places: "/places",
  Providers: "/provider-finder",
  Care: "/care",
  Transport: "/transport",
  Jobs: "/employment",
  "Foundational supports": "/guides",
  Community: "/community",
} as const;
export type Scope = keyof typeof topics;

export function scopeFor(text: string, fallback: Scope): Scope {
  if (/\b(job|jobs|employment|work)\b/i.test(text)) return "Jobs";
  if (/\b(bus|transport|trip|journey)\b/i.test(text)) return "Transport";
  if (/\b(clinic|provider|physio)\b/i.test(text)) return "Providers";
  if (/\bcommunity\b/i.test(text)) return "Community";
  return fallback;
}

export function parseWidth(text: string): number | undefined {
  if (!/^\d{1,4}$/.test(text)) return undefined;
  const value = Number(text);
  return value > 0 ? value : undefined;
}
export function comparison(door: number, minimum: number | null): string {
  if (minimum === null) return "No doorway minimum applied";
  const difference = door - minimum;
  if (!difference) return "Exactly your minimum";
  return difference > 0
    ? difference + " mm above minimum"
    : -difference + " mm below minimum";
}

export function exampleAnswer(
  question: string,
  clinic: Clinic,
  minimum: number | null,
  easyRead = false,
) {
  const prefix = "Clinic " + clinic.id + (easyRead ? ". " : " · ");
  if (easyRead) {
    if (/quiet|sensory/i.test(question))
      return (
        prefix +
        (clinic.quiet
          ? "The example lists a quiet room."
          : "There is no quiet room in this example.")
      );
    if (/route|step.free|approach|bus/i.test(question))
      return prefix + clinic.approach;
    if (/hoist/i.test(question))
      return (
        prefix + "The example lists a ceiling hoist. Its details are unknown."
      );
    if (/door|entrance|width|minimum|clinic|physio|compare/i.test(question))
      return (
        prefix +
        "The door is " +
        clinic.door +
        " mm wide. " +
        comparison(clinic.door, minimum) +
        "."
      );
    return "Ask about the door, bus stop, quiet room or hoist.";
  }
  if (/quiet|sensory/i.test(question))
    return (
      prefix +
      (clinic.quiet
        ? "A quiet room is listed."
        : "A quiet room is unavailable in this example.")
    );
  if (/route|step.free|approach|bus/i.test(question))
    return prefix + clinic.approach + " Entrance " + clinic.door + " mm.";
  if (/hoist/i.test(question))
    return (
      prefix + "A ceiling hoist is listed. Its specifications are unknown."
    );
  if (/door|entrance|width|minimum|clinic|physio|compare/i.test(question))
    return (
      prefix +
      clinic.door +
      " mm entrance. " +
      comparison(clinic.door, minimum) +
      "."
    );
  return "This example covers the entrance, bus approach, quiet room and ceiling hoist. Which would you like to check?";
}

export type DirectoryHit = { title: string; href: string; sourceLabel: string };
export function directoryUrl(scope: Scope) {
  const verticals: Partial<Record<Scope, string>> = {
    All: "all",
    Places: "places",
    Providers: "providers",
    Care: "care",
    Transport: "transport",
    Jobs: "jobs",
  };
  const vertical = verticals[scope];
  return vertical ? "/api/mapable-search?vertical=" + vertical : null;
}
export function isLocalPath(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\/(?!\/)[a-z\d/-]+(?:\?[^#\s\\]*)?$/i.test(value)
  );
}
export async function loadPublicTopics(
  origin: string,
  scope: Scope,
  signal: AbortSignal,
): Promise<DirectoryHit[]> {
  const path = directoryUrl(scope);
  if (!path)
    return [
      {
        title:
          scope === "Foundational supports"
            ? "Browse MapAble guides · general information"
            : scope + " programme information",
        href: topics[scope],
        sourceLabel: "MapAble programme navigation",
      },
    ];
  const response = await fetch(origin + path, {
    signal,
    credentials: "omit",
    referrerPolicy: "no-referrer",
  });
  if (!response.ok) throw new Error("Directory unavailable");
  const data = await response.json();
  if (!Array.isArray(data.results))
    throw new Error("Unexpected directory response");
  return data.results.filter(
    (hit: DirectoryHit) =>
      hit &&
      isLocalPath(hit.href) &&
      typeof hit.title === "string" &&
      typeof hit.sourceLabel === "string",
  );
}

export type SearchState = {
  demo: boolean;
  draft: string;
  question: string;
  scope: Scope;
  selected: ClinicId;
  minimum: number | null;
  alternatives: boolean;
  view: ResultView;
  presentation: "Conversation" | "Web";
};
export const initialState: SearchState = {
  demo: false,
  draft: "",
  question: "",
  scope: "All",
  selected: 1,
  minimum: null,
  alternatives: true,
  view: "List",
  presentation: "Conversation",
};
export type Action =
  | { type: "example" | "reset" | "submit" }
  | { type: "draft" | "phrase"; value: string }
  | { type: "scope"; value: Scope }
  | { type: "select"; value: ClinicId }
  | { type: "minimum"; value: number | null }
  | { type: "alternatives"; value: boolean }
  | { type: "view"; value: ResultView }
  | { type: "presentation"; value: SearchState["presentation"] };
export function visibleClinics(state: SearchState) {
  return clinics.filter(
    (c) =>
      state.alternatives || state.minimum === null || c.door >= state.minimum,
  );
}
export function selectedClinic(state: SearchState) {
  const visible = visibleClinics(state);
  return visible.find((c) => c.id === state.selected) ?? visible[0];
}
export function reduceSearch(state: SearchState, action: Action): SearchState {
  switch (action.type) {
    case "reset":
      return { ...initialState };
    case "example":
      return {
        ...state,
        demo: true,
        scope: "Care",
        question: exampleRequest,
        minimum: 900,
        alternatives: true,
        selected: 1,
        view: "2D map",
      };
    case "submit": {
      const question = state.draft.trim();
      if (!question) return state;
      const inferred = scopeFor(question, state.scope);
      if (state.demo && (inferred === "Jobs" || inferred === "Community")) {
        return {
          ...initialState,
          question,
          scope: inferred,
          presentation: state.presentation,
        };
      }
      return {
        ...state,
        question,
        draft: "",
        scope: state.demo ? state.scope : inferred,
      };
    }
    case "draft":
      return { ...state, draft: action.value.slice(0, 600) };
    case "phrase":
      return {
        ...state,
        draft: [state.draft.trimEnd(), action.value]
          .filter(Boolean)
          .join(" ")
          .slice(0, 600),
      };
    case "scope":
      return {
        ...initialState,
        presentation: state.presentation,
        draft: state.draft,
        scope: action.value,
      };
    case "minimum":
      return { ...state, minimum: action.value };
    case "alternatives":
      return { ...state, alternatives: action.value };
    case "select":
      return { ...state, selected: action.value };
    case "view":
      return { ...state, view: action.value };
    case "presentation":
      return { ...state, presentation: action.value };
  }
}
