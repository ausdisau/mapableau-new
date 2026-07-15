import type { AccessLensMode, AccessLensVerificationStatus } from "@/types/accessLens";
import {
  ACCESS_LENS_DISCLAIMER,
  ACCESS_LENS_TRUST_NOTE,
} from "@/types/accessLens";

export { ACCESS_LENS_DISCLAIMER, ACCESS_LENS_TRUST_NOTE };

export const accessLensHeroCopy = {
  heading: "MapAble Access Lens",
  subheading:
    "Use your camera to understand access before you enter, travel or book. Access Lens helps identify entrances, ramps, toilets, quiet spaces, drop-off points and access notes using MapAble’s community and verified access data.",
  primaryCta: { label: "Try the Lens demo", href: "/access-lens/demo" },
  secondaryCta: {
    label: "Start a business self-check",
    href: "/resources/business/access-lens-self-check",
  },
  trustNote: ACCESS_LENS_TRUST_NOTE,
  skipDemoLabel: "Skip Lens demo and read access information",
} as const;

export const accessLensHowItWorksSteps = [
  {
    title: "Point or browse",
    body: "Open the Lens demo for a camera-assisted preview, or read the same access notes in a clear list view.",
  },
  {
    title: "See key access cues",
    body: "Identify entrances, ramps, toilets, quiet spaces, drop-off points and route notes drawn from community and verified data.",
  },
  {
    title: "Check the source",
    body: "Each note shows whether it was community reported, business supplied, partner supplied, reviewed or verified by MapAble.",
  },
  {
    title: "Plan with care",
    body: "Use Access Lens to prepare. Confirm hours, bookings and current conditions before you travel.",
  },
] as const;

export type AccessLensModeCardContent = {
  mode: AccessLensMode;
  title: string;
  body: string;
  href: string;
  cta: string;
};

export const accessLensModeCards: AccessLensModeCardContent[] = [
  {
    mode: "user",
    title: "User Lens",
    body: "Preview entrances, step-free routes, toilets and quiet spaces before you arrive. Camera mode is optional — every cue is also available as text.",
    href: "/access-lens/demo",
    cta: "Open user demo",
  },
  {
    mode: "business",
    title: "Business Lens",
    body: "Capture access details for your venue with a guided self-check. Help visitors plan with clearer, more current information.",
    href: "/resources/business/access-lens-self-check",
    cta: "Start self-check",
  },
  {
    mode: "transport",
    title: "Transport and pickup",
    body: "Find drop-off points, kerb ramps and path notes that support accessible arrival and departure planning.",
    href: "/access-lens#transport-pickup",
    cta: "Read pickup guidance",
  },
  {
    mode: "sensory",
    title: "Sensory-friendly mode",
    body: "Highlight quiet spaces and sensory warnings so people can choose calmer routes and resting places.",
    href: "/access-lens#sensory-friendly",
    cta: "Explore sensory mode",
  },
];

export const accessLensTransportCopy = {
  title: "Transport and pickup guidance",
  body: "Access Lens can surface drop-off zones, kerb ramps, path widths and nearby parking notes so drivers, support workers and travellers can plan a safer arrival. Always confirm restrictions and staff-assisted access with the venue or transport provider.",
} as const;

export const accessLensSensoryCopy = {
  title: "Sensory-friendly mode",
  body: "Sensory-friendly mode emphasises quiet spaces, lower-stimulus routes and clear sensory warnings. It is planning support only — noise, light and crowd levels can change during the day.",
} as const;

export const accessLensBuiltForA11yCopy = {
  title: "Built for accessibility",
  body: "Camera assistance is optional. Every overlay has a matching list entry. Controls are keyboard accessible, focus states are visible, tap targets are at least 44px, and motion respects prefers-reduced-motion.",
  points: [
    "One page heading and semantic sections",
    "List view equivalent for every camera cue",
    "No hover-only actions",
    "High-contrast overlays and plain language",
  ],
} as const;

export const accessLensPrivacyBullets = [
  "Camera and video are not stored by default.",
  "Photos are only uploaded after you confirm.",
  "Faces and number plates should be blurred before publication.",
  "You can submit anonymously where appropriate.",
  "Location sharing is opt-in and time-limited.",
  "Exact personal addresses must not be public.",
] as const;

export const accessLensPrivacyIntro =
  "Access Lens is designed so people can contribute useful access information without giving up unnecessary personal data.";

export type AccessLensVerificationExplain = {
  status: AccessLensVerificationStatus;
  label: string;
  explanation: string;
};

export const accessLensVerificationExplainers: AccessLensVerificationExplain[] =
  [
    {
      status: "community_reported",
      label: "Community reported",
      explanation:
        "Shared by a community member based on their experience at the place.",
    },
    {
      status: "business_supplied",
      label: "Business supplied",
      explanation:
        "Provided by the venue or business through a self-check or claim flow.",
    },
    {
      status: "partner_supplied",
      label: "Partner supplied",
      explanation:
        "Shared by a trusted partner organisation contributing access data.",
    },
    {
      status: "mapable_reviewed",
      label: "MapAble reviewed",
      explanation:
        "Checked by MapAble for clarity and consistency. Still subject to change on site.",
    },
    {
      status: "mapable_verified",
      label: "MapAble verified",
      explanation:
        "Confirmed against MapAble verification criteria. Not a legal compliance certificate.",
    },
    {
      status: "needs_update",
      label: "Needs update",
      explanation:
        "Marked as possibly out of date. Prefer a local check before relying on it.",
    },
  ];

export const accessLensUseCases = [
  {
    id: "how-it-works",
    title: "How Access Lens works",
    body: "Combine camera-assisted cues with list-based access notes so everyone can understand entrances, routes and facilities.",
  },
  {
    id: "before-you-go",
    title: "Before you enter or book",
    body: "Preview practical details that help you decide whether a place is likely to work for your access needs.",
  },
  {
    id: "transport-arrival",
    title: "Arrive with fewer surprises",
    body: "Use drop-off, kerb-ramp and path notes to plan arrivals with drivers or support workers.",
  },
  {
    id: "quiet-options",
    title: "Find quieter options",
    body: "Surface quiet spaces and sensory warnings when calmer environments matter.",
  },
  {
    id: "business-share",
    title: "Help visitors prepare",
    body: "Businesses can share access notes that visitors can read as text or see in the Lens demo.",
  },
  {
    id: "verify-sources",
    title: "Know the source",
    body: "Verification labels make it clear who supplied each note and how much review it has had.",
  },
] as const;

export const accessLensPilotRoadmap = [
  {
    phase: "Now",
    title: "Product scaffold and demo",
    body: "Public information pages, mock Lens demo, list views and advisory copy.",
  },
  {
    phase: "Next",
    title: "Guided capture pilots",
    body: "Camera-assisted capture with confirmation before any photo upload, plus business self-check trials.",
  },
  {
    phase: "Later",
    title: "Broader place and guide coverage",
    body: "Richer place and city-guide Lens views, stronger verification workflows and transport pickup guidance.",
  },
] as const;

export const accessLensPilotCtaCopy = {
  title: "Join the Access Lens pilot",
  body: "We are inviting users, venues and partners to help shape Access Lens. Join the pilot to share feedback, trial self-checks and improve community access information.",
  ctaLabel: "Join pilot",
  ctaHref: "/contact",
  disclaimer: ACCESS_LENS_DISCLAIMER,
} as const;

export const accessLensBusinessSelfCheckIntro = {
  eyebrow: "Business resource",
  title: "Access Lens self-check",
  description:
    "Use this checklist to note practical access information for your venue. This is a planning aid for visitors — not an audit, accreditation or legal compliance assessment.",
} as const;

export const accessLensBusinessChecklistHints: Record<string, string> = {
  entrance: "Describe the main and accessible entrances, including any steps or assistance needed.",
  step: "Note stairs or steps that may affect wheelchair or mobility-aid access.",
  threshold: "Record raised door thresholds and whether a portable ramp is available.",
  ramp: "Note ramp location, gradient feel and handrail availability where known.",
  doorway: "Record doorway width guidance and whether doors are automatic or staff-assisted.",
  toilet: "Describe accessible toilets, Changing Places, and wayfinding to them.",
  lift: "Note lift location, size guidance and any outages you regularly see.",
  path: "Describe main outdoor or indoor paths, surfaces and steep sections.",
  "kerb-ramp": "Mark kerb ramps near entrances and drop-off points.",
  parking: "Share accessible parking location and any booking requirements.",
  dropoff: "Identify sheltered or preferred drop-off and pickup points.",
  "quiet-space": "Describe quiet or lower-stimulus resting areas guests can use.",
  "sensory-warning": "Flag known loud, bright or crowded areas and quieter alternatives.",
  signage: "Note tactile, high-contrast or assisted-wayfinding signage.",
  hazard: "Flag temporary works, slippery surfaces or other access hazards.",
};
