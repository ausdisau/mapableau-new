export const VISION_ACCESS_PRODUCT_NAME = "MapAble Access Lens";
export const VISION_ACCESS_OS_NAME = "MapAble VisionAccessOS";

export const VISION_ACCESS_TRUST_NOTE =
  "Access Lens shows provisional visual candidates. It is not a guarantee of access, a legal assessment, or a navigation aid.";

export const VISION_ACCESS_DISCLAIMER =
  "MapAble Access Lens provides practical access information to help people plan outings. Automated results are candidates only — not certified measurements, building certification, legal accessibility assessments, emergency routes, or proof that a route is safe or an entrance is usable. Conditions can change. Access Lens does not replace a white cane, guide dog, orientation and mobility training, or a professional access assessment. Check opening hours, bookings, transport availability and venue accessibility before travelling.";

export const VISION_ACCESS_MEASUREMENT_LIMITATION =
  "Measurement unavailable or provisional only. Depth and geometry estimates are not certified measurements and must not be treated as compliance proof.";

export const VISION_ACCESS_NO_NAVIGATION =
  "Access Lens is not turn-by-turn navigation. Stop moving before reviewing candidates. Unseen or misdetected hazards may remain.";

export const VISION_ACCESS_SYNTHETIC_BANNER =
  "Synthetic demo — fixture scenes only. No camera, no photo upload, no live detection, and no changes to AccessPlace records.";

export const visionAccessHeroCopy = {
  heading: VISION_ACCESS_PRODUCT_NAME,
  subheading:
    "Scan entrances, doorways, steps, ramps and temporary barriers as provisional candidates — with a full text list for every cue. Camera assistance is optional and not required for this demo.",
  primaryCta: { label: "Open synthetic demo", href: "/access-lens/demo" },
  secondaryCta: {
    label: "Read how candidates work",
    href: "/access-lens#how-it-works",
  },
  trustNote: VISION_ACCESS_TRUST_NOTE,
  skipDemoLabel: "Skip demo and read access guidance",
} as const;

export const visionAccessHowItWorksSteps = [
  {
    title: "Choose a purpose",
    body: "Purpose controls what is retained, whether location is requested, and whether upload is offered. Camera permission is never upload consent.",
  },
  {
    title: "Review candidates",
    body: "On-device perception (when available) produces candidates — not verified claims. Every overlay has a list equivalent.",
  },
  {
    title: "Confirm or reject",
    body: "You decide whether a candidate matches what you see. Nothing is published automatically.",
  },
  {
    title: "Optional evidence",
    body: "Only after confirmation may a redacted evidence bundle be submitted for moderation. MapAble services classify evidence; humans verify.",
  },
] as const;

export const visionAccessPrivacyBullets = [
  "Frames are ephemeral by default; raw video is not stored.",
  "Photos upload only after you explicitly confirm.",
  "Faces and number plates must be redacted before any publication path.",
  "No facial recognition, person re-identification, or disability inference.",
  "No continuous background recording.",
  "Precise location requires a separate purpose and consent.",
  "Exact personal addresses must not be public.",
] as const;

export const visionAccessBuiltForA11yCopy = {
  title: "Built for accessibility",
  body: "Camera assistance is optional. Every overlay has a matching list entry. Controls target VoiceOver, TalkBack, large text, reduced motion, and one-handed use. No compulsory visual aiming in production modes.",
  points: [
    "List view equivalent for every candidate",
    "Spoken and text guidance planned for non-visual capture",
    "Immediate camera-off and stop controls (native waves)",
    "No colour-only meaning; high-contrast labels",
  ],
} as const;
