/**
 * MapAble public Companion: deterministic, Botkit-inspired guided conversation.
 *
 * Each step is an explicit state transition, rather than an LLM instruction or
 * a Botkit runtime dependency. This pure module never performs I/O, requests,
 * account lookups, advertising ranking, inference or persistence.
 */
export const PUBLIC_GUIDE_GOALS = [
  {
    id: "providers",
    label: "Find a support provider",
    description: "Review publicly listed support organisations and their evidence.",
    href: "/provider-finder",
    actionLabel: "Open Provider Finder",
  },
  {
    id: "care",
    label: "Explore care and support",
    description: "Learn about support services and coordination pathways.",
    href: "/care",
    actionLabel: "Explore MapAble Care",
  },
  {
    id: "transport",
    label: "Plan accessible travel",
    description: "Explore transport information and accessible travel options.",
    href: "/transport",
    actionLabel: "Explore Transport",
  },
  {
    id: "jobs",
    label: "Explore inclusive employment",
    description: "Explore jobs and adjustment-aware employment pathways.",
    href: "/employment",
    actionLabel: "Explore Employment",
  },
  {
    id: "access",
    label: "Find accessibility information",
    description: "Look for accessibility reports and what is still unknown.",
    href: "/access",
    actionLabel: "Explore accessibility information",
  },
  {
    id: "human",
    label: "Talk to a person",
    description: "Go straight to MapAble's public contact pathway.",
    href: "/contact",
    actionLabel: "Contact MapAble",
  },
] as const;

export type PublicGuideGoal = (typeof PUBLIC_GUIDE_GOALS)[number]["id"];
export type PublicGuideStep = "goal" | "location" | "access" | "review";
export type PublicGuideState = Readonly<{
  step: PublicGuideStep;
  goal: PublicGuideGoal | null;
  location: string;
  access: string;
}>;

export type PublicGuideAction =
  | { type: "choose_goal"; goal: PublicGuideGoal }
  | { type: "set_location"; value: string }
  | { type: "set_access"; value: string }
  | { type: "next" }
  | { type: "skip" }
  | { type: "back" }
  | { type: "edit"; field: "location" | "access" }
  | { type: "restart" };

export function initialPublicGuide(): PublicGuideState {
  return { step: "goal", goal: null, location: "", access: "" };
}

function cleanDraft(value: string, max: number): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").slice(0, max);
}

/** Explicit, inspectable Botkit-style threads; no invisible model decisions. */
export function reducePublicGuide(
  state: PublicGuideState,
  action: PublicGuideAction,
): PublicGuideState {
  switch (action.type) {
    case "restart":
      return initialPublicGuide();
    case "choose_goal": {
      if (!PUBLIC_GUIDE_GOALS.some((item) => item.id === action.goal)) return state;
      return {
        step: action.goal === "human" ? "review" : "location",
        goal: action.goal,
        location: "",
        access: "",
      };
    }
    case "set_location":
      return state.step === "location"
        ? { ...state, location: cleanDraft(action.value, 80) }
        : state;
    case "set_access":
      return state.step === "access"
        ? { ...state, access: cleanDraft(action.value, 160) }
        : state;
    case "next":
      if (state.step === "location") return { ...state, step: "access" };
      if (state.step === "access") return { ...state, step: "review" };
      return state;
    case "skip":
      if (state.step === "location") {
        return { ...state, location: "", step: "access" };
      }
      if (state.step === "access") {
        return { ...state, access: "", step: "review" };
      }
      return state;
    case "back":
      if (state.step === "location") return { ...state, step: "goal" };
      if (state.step === "access") return { ...state, step: "location" };
      if (state.step === "review") {
        return { ...state, step: state.goal === "human" ? "goal" : "access" };
      }
      return state;
    case "edit":
      if (state.step !== "review" || !state.goal || state.goal === "human") return state;
      return { ...state, step: action.field };
    default:
      return state;
  }
}

export type PublicGuideReview = Readonly<{
  label: string;
  description: string;
  href: string;
  actionLabel: string;
  location: string | null;
  access: string | null;
}>;

/**
 * The destination is a literal, reviewed MapAble page. Never append free text
 * (which might contain health, disability or location details) to URLs.
 */
export function reviewPublicGuide(state: PublicGuideState): PublicGuideReview | null {
  const goal = PUBLIC_GUIDE_GOALS.find((item) => item.id === state.goal);
  if (!goal || state.step !== "review") return null;
  return {
    label: goal.label,
    description: goal.description,
    href: goal.href,
    actionLabel: goal.actionLabel,
    location: state.location.trim() || null,
    access: state.access.trim() || null,
  };
}
