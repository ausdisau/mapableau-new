/**
 * Community Mapping Challenges for the production-disabled Access Signals demo.
 * Every fixture is fictional and unpublished. Challenge participation never
 * changes a route's RAGU rating, evidence provenance, or verification state.
 */
import { DEMO_ROUTES, type AccessDomain } from "@/lib/access-signals/demo-data";

export type ChallengeFocus = AccessDomain | "all";
export type ChallengeMode = "remote" | "on_site" | "with_support";

export type ChallengeStep = {
  id: string;
  label: string;
  guidance: string;
};

export type CommunityChallenge = {
  id: string;
  title: string;
  summary: string;
  publicQuestion: string;
  focus: AccessDomain;
  routeId: string;
  scope: "Fictional test precinct";
  contributionModes: readonly ChallengeMode[];
  evidencePrompt: string;
  steps: readonly ChallengeStep[];
  synthetic: true;
  published: false;
};

export const CHALLENGE_MODE_LABELS: Readonly<Record<ChallengeMode, string>> = {
  remote: "From home",
  on_site: "On-site where safe",
  with_support: "With chosen support",
};

export const COMMUNITY_CHALLENGES: readonly CommunityChallenge[] = [
  {
    id: "connect-the-journey",
    title: "Connect the Journey",
    summary: "Explore gaps between a crossing, a pathway and an entrance.",
    publicQuestion: "Which route segment needs more evidence before someone can plan a journey?",
    focus: "physical",
    routeId: "demo-route-a",
    scope: "Fictional test precinct",
    contributionModes: ["remote", "on_site", "with_support"],
    evidencePrompt: "Segment, surface or crossing feature; date; measurement method; uncertainty.",
    steps: [
      { id: "review", label: "Review the route", guidance: "Use the fictional route list. Do not rely on the illustrative map for directions." },
      { id: "identify", label: "Choose an evidence gap", guidance: "Note which crossing, kerb or path detail is missing, not whether the entire journey is safe." },
      { id: "describe", label: "Draft a scoped observation", guidance: "Distinguish measurement, estimate and unknown. Never enter a live-road hazard to collect evidence." },
    ],
    synthetic: true,
    published: false,
  },
  {
    id: "every-entrance-counts",
    title: "Every Entrance Counts",
    summary: "Practise describing an entrance without labelling a whole venue accessible.",
    publicQuestion: "Which entrance details would let a visitor decide if it meets their needs?",
    focus: "physical",
    routeId: "demo-route-c",
    scope: "Fictional test precinct",
    contributionModes: ["remote", "on_site", "with_support"],
    evidencePrompt: "Entrance type, threshold, clear opening, alternative entrance and dated source.",
    steps: [
      { id: "scope", label: "Identify the entrance", guidance: "Specify which entrance is being considered, not the venue as a whole." },
      { id: "facts", label: "List useful measurements", guidance: "Separate measured widths from estimates or staff-reported information." },
      { id: "unknown", label: "Name what remains unknown", guidance: "Leave unassessed access features as unknown rather than guessing green." },
    ],
    synthetic: true,
    published: false,
  },
  {
    id: "quiet-clear-welcoming",
    title: "Quiet, Clear and Welcoming",
    summary: "Consider sensory comfort, wayfinding and communication information.",
    publicQuestion: "What information would help someone prepare for a sensory or communication need?",
    focus: "sensory",
    routeId: "demo-route-b",
    scope: "Fictional test precinct",
    contributionModes: ["remote", "with_support"],
    evidencePrompt: "Quiet-space availability, lighting, noise, signs, accessible formats or communication support; source and date.",
    steps: [
      { id: "feature", label: "Choose one feature", guidance: "Focus on one observable feature such as signage, sound or communication formats." },
      { id: "source", label: "Identify the source", guidance: "Separate publicly available information from direct observation or personal experience." },
      { id: "write", label: "Use clear and respectful language", guidance: "Avoid assumptions about anyone's diagnosis, behaviour or capacity." },
    ],
    synthetic: true,
    published: false,
  },
  {
    id: "essential-access",
    title: "Essential Access",
    summary: "Document the details people need about essential public facilities.",
    publicQuestion: "Which practical facility details are missing or need confirmation?",
    focus: "physical",
    routeId: "demo-route-c",
    scope: "Fictional test precinct",
    contributionModes: ["remote", "with_support"],
    evidencePrompt: "Facility type, public availability, equipment, opening restrictions, source date and limitations.",
    steps: [
      { id: "choose", label: "Choose a facility type", guidance: "Examples include accessible toilets, Changing Places and lifts." },
      { id: "details", label: "Specify the useful details", guidance: "Do not treat a sign or an online claim as independent verification of equipment." },
      { id: "limits", label: "Record limitations", guidance: "Note missing information and avoid photographing occupied private spaces." },
    ],
    synthetic: true,
    published: false,
  },
  {
    id: "still-accessible",
    title: "Is It Still Accessible?",
    summary: "Practise identifying stale information and changes requiring re-verification.",
    publicQuestion: "What changed, and which dated observation should be reviewed?",
    focus: "cognitive",
    routeId: "demo-route-b",
    scope: "Fictional test precinct",
    contributionModes: ["remote", "with_support"],
    evidencePrompt: "Original source and date, observed change, correction evidence, review date and disputed status.",
    steps: [
      { id: "find", label: "Find an older record", guidance: "Use the fictional route and identify exactly which claim is out of date." },
      { id: "compare", label: "Compare with a later source", guidance: "Distinguish a report of change from a verified change." },
      { id: "flag", label: "Draft a correction request", guidance: "Explain the uncertainty. A submitted challenge must never silently overwrite the earlier record." },
    ],
    synthetic: true,
    published: false,
  },
] as const;

export const CHALLENGE_SAFETY_RULES = [
  "No travel, diagnosis disclosure, photograph or participation pace is required.",
  "Do not trespass, enter unsafe crossings or approach hazards to gather evidence.",
  "Do not record faces, number plates, private homes or identifiable personal details.",
  "Use dates, sources and scoped features; unknown is a valid finding.",
  "The demonstration does not submit, verify or publish any place information.",
] as const;

export function filterCommunityChallenges(focus: ChallengeFocus) {
  return focus === "all"
    ? COMMUNITY_CHALLENGES
    : COMMUNITY_CHALLENGES.filter((challenge) => challenge.focus === focus);
}

export function getCommunityChallenge(id: string | undefined) {
  return COMMUNITY_CHALLENGES.find((challenge) => challenge.id === id);
}

export function challengeFieldNotesHref(challenge: CommunityChallenge) {
  return "/access-signals/field-notes?route=" +
    encodeURIComponent(challenge.routeId) +
    "&challenge=" +
    encodeURIComponent(challenge.id);
}

export function assertChallengesAreSafeDemo() {
  const routeIds = new Set(DEMO_ROUTES.map((route) => route.id));
  const ids = new Set<string>();
  return COMMUNITY_CHALLENGES.length > 0 &&
    COMMUNITY_CHALLENGES.every((challenge) => {
      if (ids.has(challenge.id)) return false;
      ids.add(challenge.id);
      const stepIds = challenge.steps.map((step) => step.id);
      return challenge.synthetic === true &&
        challenge.published === false &&
        challenge.scope === "Fictional test precinct" &&
        routeIds.has(challenge.routeId) &&
        challenge.contributionModes.includes("remote") &&
        stepIds.length > 0 &&
        new Set(stepIds).size === stepIds.length;
    });
}
