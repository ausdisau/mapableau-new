import type { LearningObjective, LearningScenario, RubricCriterion } from "./schemas";

const BASE_RUBRIC: RubricCriterion[] = [
  {
    id: "rc-req",
    dimension: "requirement_recognition",
    description: "Recognise functional access requirements for the human goal.",
    expectedBehaviours: ["Names required features", "Does not invent preferences as blockers"],
    weight: 1,
  },
  {
    id: "rc-ev",
    dimension: "evidence_reasoning",
    description: "Inspect evidence quality before deciding.",
    expectedBehaviours: ["Checks verification status", "Does not upgrade unknown to fact"],
    weight: 1,
  },
  {
    id: "rc-un",
    dimension: "uncertainty_handling",
    description: "Keep unknowns explicit and plan contingencies.",
    expectedBehaviours: ["Flags unknowns", "Uses suitable_with_conditions when needed"],
    weight: 1,
  },
  {
    id: "rc-route",
    dimension: "route_and_contingency",
    description: "Choose feasible routes and timing buffers.",
    expectedBehaviours: ["Selects eligible route", "Accounts for live incidents"],
    weight: 1,
  },
  {
    id: "rc-consent",
    dimension: "consent_rights_privacy_communication",
    description: "Protect consent, rights, privacy, and respectful communication.",
    expectedBehaviours: [
      "Minimises disclosure",
      "Does not infer cognitive capacity from disability",
    ],
    weight: 1,
  },
];

function stages(orientationPrompt: string) {
  return [
    {
      id: "st-orientation",
      stage: "orientation" as const,
      title: "Your goal",
      prompt: orientationPrompt,
      evidenceIdsVisible: [],
      allowHints: false,
    },
    {
      id: "st-prediction",
      stage: "prediction" as const,
      title: "Predict",
      prompt: "Predict the access fit before inspecting full evidence.",
      evidenceIdsVisible: [],
      allowHints: true,
    },
    {
      id: "st-investigation",
      stage: "investigation" as const,
      title: "Investigate",
      prompt: "Inspect verified, partial, and unknown evidence.",
      evidenceIdsVisible: ["*"],
      allowHints: true,
    },
    {
      id: "st-decision",
      stage: "decision" as const,
      title: "Decide",
      prompt: "Choose an access decision that respects requirements and unknowns.",
      evidenceIdsVisible: ["*"],
      allowHints: true,
    },
    {
      id: "st-consequence",
      stage: "consequence" as const,
      title: "Consequence",
      prompt: "Review the consequence of your decision.",
      evidenceIdsVisible: ["*"],
      allowHints: false,
    },
    {
      id: "st-revision",
      stage: "revision" as const,
      title: "Revise",
      prompt: "Revise if you treated unknowns as facts or skipped a feasible route.",
      evidenceIdsVisible: ["*"],
      allowHints: true,
    },
    {
      id: "st-teach",
      stage: "teach_back" as const,
      title: "Teach back",
      prompt: "Explain the decision in your own words.",
      evidenceIdsVisible: ["*"],
      allowHints: false,
    },
    {
      id: "st-reflect",
      stage: "reflection" as const,
      title: "Reflect",
      prompt: "Reflect on what you would check next time.",
      evidenceIdsVisible: [],
      allowHints: false,
    },
    {
      id: "st-transfer",
      stage: "transfer" as const,
      title: "Transfer",
      prompt: "Complete the transfer task for a related goal.",
      evidenceIdsVisible: [],
      allowHints: false,
    },
    {
      id: "st-complete",
      stage: "complete" as const,
      title: "Complete",
      prompt: "Scenario complete. Plan mode remains available without lessons.",
      evidenceIdsVisible: [],
      allowHints: false,
    },
  ];
}

const publication = {
  author: "MapAble Learning Design",
  accessibilityReviewer: "A11y Review Desk",
  livedExperienceReviewer: "Lived Experience Panel",
  professionalReviewer: "Access Planning Advisor",
  jurisdiction: "AU",
  reviewDate: "2026-07-01",
  sourceMaterial: ["Didactic MapAble Access Intelligence curriculum"],
};

export const LEARNING_OBJECTIVES: LearningObjective[] = [
  {
    id: "obj-requirement-recognition",
    title: "Requirement recognition",
    description: "Identify functional access requirements for a human goal.",
    concepts: ["requirement_recognition"],
    audience: ["individual", "family", "workforce", "community"],
    jurisdiction: "AU",
  },
  {
    id: "obj-evidence-quality",
    title: "Evidence reasoning",
    description: "Distinguish verified, partial, conflicting, and unknown evidence.",
    concepts: ["evidence_reasoning"],
    audience: ["individual", "family", "workforce", "community"],
    jurisdiction: "AU",
  },
  {
    id: "obj-uncertainty",
    title: "Uncertainty handling",
    description: "Keep unknowns explicit and plan contingencies.",
    concepts: ["uncertainty_handling"],
    audience: ["individual", "family", "workforce", "community"],
    jurisdiction: "AU",
  },
  {
    id: "obj-route-planning",
    title: "Route and contingency planning",
    description: "Select feasible routes and timing buffers.",
    concepts: ["route_and_contingency"],
    audience: ["individual", "family", "workforce", "community"],
    jurisdiction: "AU",
  },
  {
    id: "obj-consent-privacy",
    title: "Consent, rights, privacy, and communication",
    description: "Protect privacy and avoid capacity inference from disability.",
    concepts: ["consent_rights_privacy_communication"],
    audience: ["individual", "family", "workforce", "community"],
    jurisdiction: "AU",
  },
];

/** Evidence catalogue referenced by scenario evidenceIds (demo didactic pack). */
export const LEARNING_EVIDENCE: Record<
  string,
  { id: string; label: string; status: "verified" | "partial" | "unknown" | "conflicting"; summary: string }
> = {
  "ev-lift-verified": {
    id: "ev-lift-verified",
    label: "Lift to levels 1–5",
    status: "verified",
    summary: "Building manager verified lift serves level 3; checked this morning.",
  },
  "ev-reception-partial": {
    id: "ev-reception-partial",
    label: "Reception seating",
    status: "partial",
    summary: "Quiet corner mentioned in brochure; not recently verified.",
  },
  "ev-stairs-unknown": {
    id: "ev-stairs-unknown",
    label: "Stair-only fire exit route",
    status: "unknown",
    summary: "Evacuation stair details not mapped for this learner scenario.",
  },
  "ev-outage": {
    id: "ev-outage",
    label: "Lift outage notice",
    status: "verified",
    summary: "Facility app: Lift A offline until 14:00; Lift B operating.",
  },
  "ev-alt-route": {
    id: "ev-alt-route",
    label: "Step-free alternate",
    status: "partial",
    summary: "Side entrance path claimed step-free; not auditor-verified today.",
  },
  "ev-staff-escort": {
    id: "ev-staff-escort",
    label: "Staff escort availability",
    status: "unknown",
    summary: "No live confirmation for escort on request.",
  },
  "ev-quiet-room": {
    id: "ev-quiet-room",
    label: "Quiet room",
    status: "verified",
    summary: "Organiser verified quiet room near Gate B, open 10:00–15:00.",
  },
  "ev-noise": {
    id: "ev-noise",
    label: "Stage noise plan",
    status: "partial",
    summary: "Schedule lists quieter hours; real-time levels not streamed.",
  },
  "ev-crowd": {
    id: "ev-crowd",
    label: "Crowd density forecast",
    status: "unknown",
    summary: "No live crowd sensor feed for this demo.",
  },
  "ev-tgsi": {
    id: "ev.tgsi",
    label: "TGSI path to Platform 2",
    status: "verified",
    summary: "Audit confirmed continuous TGSI to Platform 2.",
  },
  "ev-audio": {
    id: "ev-audio",
    label: "Audible next-train announcements",
    status: "partial",
    summary: "Announcements present; volume inconsistent at far end.",
  },
  "ev-staff": {
    id: "ev-staff",
    label: "Assistance desk hours",
    status: "unknown",
    summary: "Desk hours not confirmed for late evening.",
  },
  "ev-private-desk": {
    id: "ev-private-desk",
    label: "Side desk for private check-in",
    status: "verified",
    summary: "Reception offers a quieter side desk on request.",
  },
  "ev-script": {
    id: "ev-script",
    label: "Staff communication guidance",
    status: "partial",
    summary: "Poster encourages asking before physical assistance.",
  },
  "ev-masking": {
    id: "ev-masking",
    label: "Whether reception will announce disability aloud",
    status: "unknown",
    summary: "No verified policy statement in this demo pack.",
  },
  "ev-toilet": {
    id: "ev-toilet",
    label: "Accessible toilet",
    status: "verified",
    summary: "Venue studio record: accessible toilet near rear entrance.",
  },
  "ev-entry": {
    id: "ev-entry",
    label: "Step-free entry",
    status: "partial",
    summary: "Photo suggests ramp; slope not measured.",
  },
  "ev-staff-knows": {
    id: "ev-staff-knows",
    label: "Whether staff know medical details",
    status: "unknown",
    summary: "No need for medical detail in a spatial verification call.",
  },
};

// Fix accidental id typo in catalogue
LEARNING_EVIDENCE["ev-tgsi"]!.id = "ev-tgsi";

export const LEARNING_SCENARIOS: LearningScenario[] = [
  {
    id: "interview-level-three",
    title: "Interview on level three",
    humanGoal: "Arrive on time and with dignity for a job interview on level 3.",
    placeId: "place-harbour-civic",
    destination: "Suite 3.12 — interview room",
    passportId: "passport-power-chair",
    objectiveIds: ["obj-route-planning", "obj-evidence-quality", "obj-uncertainty"],
    audience: ["individual", "workforce"],
    stages: stages(
      "Prepare for a level-3 interview using access evidence. Text map: Street entrance → foyer → lift lobby (verified to level 3) → corridor to suite 3.12.",
    ),
    decisionPoints: [
      {
        id: "dp-interview-route",
        prompt: "Which access plan best fits the interview goal?",
        options: [
          {
            id: "opt-lift-primary",
            label: "Take the verified lift; allow buffer; note unknown fire-exit detail",
            predictedStatus: "suitable_with_conditions",
          },
          {
            id: "opt-stairs-assume",
            label: "Assume stairs are fine because the office is open",
            predictedStatus: "suitable",
          },
          {
            id: "opt-cancel",
            label: "Cancel solely because one evidence item is unknown",
            predictedStatus: "blocked",
          },
        ],
        expectedOptionId: "opt-lift-primary",
        rationale:
          "Use verified lift evidence, keep unknowns explicit, keep contingency buffer.",
      },
    ],
    dynamicEvents: [
      {
        id: "dyn-lift-busy",
        title: "Peak-time queue at the lift",
        description: "Live notice: lift lobby is congested; allow extra minutes.",
        introducesIncidentId: "inc-lift-queue",
        triggerAfterStage: "decision",
      },
    ],
    evidenceIds: ["ev-lift-verified", "ev-reception-partial", "ev-stairs-unknown"],
    unknownHighlights: ["Fire-exit stair accessibility is unknown"],
    expectedReasoning: [
      "Verified lift serves level 3",
      "Unknown fire exit does not invent a blocker or a guarantee",
      "Buffer time handles live congestion",
    ],
    formativeFeedback: {
      good: "You treated verified lift access as primary and kept unknowns visible.",
      needs_work:
        "Avoid treating unknown evidence as proof, and do not abandon feasible verified routes without cause.",
    },
    teachBackPrompt:
      "Explain why verifying the lift matters more than assuming stairs are available.",
    teachBackKeywords: ["lift", "verified", "unknown", "stairs", "contingency"],
    reflectionPrompts: [
      "Which evidence status most influenced you?",
      "How did you treat the unknown fire-exit detail?",
    ],
    transferTask: {
      title: "Clinic on level 4",
      instructions:
        "Outline an access plan for a medical appointment on level 4 with partial lift verification.",
      successCriteria: [
        "Names requirement",
        "Notes evidence quality",
        "Includes contingency for unknown",
      ],
    },
    rubric: BASE_RUBRIC,
    published: true,
    version: "1.0.0",
    ...publication,
  },
  {
    id: "lift-outage-appointment",
    title: "Lift outage before an appointment",
    humanGoal: "Keep a specialist appointment after a lift outage notice.",
    placeId: "place-harbour-civic",
    destination: "Clinic suite level 2",
    passportId: "passport-power-chair",
    objectiveIds: ["obj-route-planning", "obj-uncertainty", "obj-consent-privacy"],
    audience: ["individual"],
    stages: stages(
      "Respond to a live lift outage. Text map: Car park → lobby → Lift A (offline) / Lift B (online) → clinic corridor.",
    ),
    decisionPoints: [
      {
        id: "dp-outage",
        prompt: "How do you replan after the outage?",
        options: [
          {
            id: "opt-lift-b",
            label: "Use verified Lift B; leave earlier; flag escort as unknown",
            predictedStatus: "suitable_with_conditions",
          },
          {
            id: "opt-ignore",
            label: "Ignore the outage and keep the original timing",
            predictedStatus: "suitable",
          },
          {
            id: "opt-assume-escort",
            label: "Assume staff escort will be ready without confirming",
            predictedStatus: "suitable",
          },
        ],
        expectedOptionId: "opt-lift-b",
        rationale:
          "Re-route using verified operational lift; hold unknown escort as contingency only.",
      },
    ],
    dynamicEvents: [
      {
        id: "dyn-outage-extend",
        title: "Outage extended",
        description: "Lift A ETA slips; Lift B still verified online.",
        introducesIncidentId: "inc-lift-a-outage",
        triggerAfterStage: "decision",
      },
    ],
    evidenceIds: ["ev-outage", "ev-alt-route", "ev-staff-escort"],
    unknownHighlights: ["Staff escort availability is unknown"],
    expectedReasoning: [
      "Verified outage on Lift A",
      "Lift B remains eligible",
      "Do not invent escort availability",
    ],
    formativeFeedback: {
      good: "You replanned with verified Lift B and kept escort unknown.",
      needs_work: "Do not ignore verified outages or invent escort availability.",
    },
    teachBackPrompt:
      "Describe how a verified outage changes timing without removing an eligible alternate lift.",
    teachBackKeywords: ["outage", "Lift B", "verified", "unknown", "escort", "timing"],
    reflectionPrompts: [
      "What would you message to the clinic?",
      "Which consent limit applies if asking staff to share your needs?",
    ],
    transferTask: {
      title: "Future outage checklist",
      instructions: "Write three contingency checks for a future outage notice.",
      successCriteria: [
        "Status verification",
        "Alternate route",
        "Communication consent",
      ],
    },
    rubric: BASE_RUBRIC,
    published: true,
    version: "1.0.0",
    ...publication,
  },
  {
    id: "sensory-community-event",
    title: "Sensory-friendly community event",
    humanGoal: "Attend a community fair with sensory regulation supports.",
    placeId: "place-riverside-hall",
    destination: "Community fair — Gate B",
    passportId: "passport-sensory",
    objectiveIds: ["obj-requirement-recognition", "obj-evidence-quality"],
    audience: ["family", "community"],
    stages: stages(
      "Plan sensory-friendly attendance. Text map: Gate B → quiet room corridor → fairground → main stage (louder after 14:00).",
    ),
    decisionPoints: [
      {
        id: "dp-sensory",
        prompt: "Pick an arrival plan that respects sensory requirements.",
        options: [
          {
            id: "opt-quiet-window",
            label:
              "Arrive in quieter window; use verified quiet room; treat crowds as unknown",
            predictedStatus: "suitable_with_conditions",
          },
          {
            id: "opt-peak",
            label: "Arrive at peak fireworks — assume it will be fine",
            predictedStatus: "suitable",
          },
          {
            id: "opt-skip-quiet",
            label: "Ignore quiet room because crowd density is unknown",
            predictedStatus: "unknown",
          },
        ],
        expectedOptionId: "opt-quiet-window",
        rationale:
          "Anchor on verified quiet room and quieter windows; keep crowd unknown.",
      },
    ],
    dynamicEvents: [],
    evidenceIds: ["ev-quiet-room", "ev-noise", "ev-crowd"],
    unknownHighlights: ["Crowd density forecast is unknown"],
    expectedReasoning: [
      "Quiet room is verified",
      "Noise plan is partial",
      "Crowd density stays unknown",
    ],
    formativeFeedback: {
      good: "You used quieter windows and the verified quiet room.",
      needs_work: "Do not invent crowd certainty or skip verified quiet supports.",
    },
    teachBackPrompt:
      "How do verified quiet spaces and unknown crowd density fit together in one plan?",
    teachBackKeywords: ["quiet", "verified", "crowd", "unknown", "window"],
    reflectionPrompts: [
      "What would you pack as a personal contingency?",
      "When would you leave early?",
    ],
    transferTask: {
      title: "Cinema sensory screening",
      instructions: "List two evidence checks before a cinema sensory screening.",
      successCriteria: ["Mentions verified quiet features", "Names one unknown"],
    },
    rubric: BASE_RUBRIC,
    published: true,
    version: "1.0.0",
    ...publication,
  },
  {
    id: "tactile-audible-wayfinding",
    title: "Tactile and audible wayfinding",
    humanGoal: "Navigate a station transfer using tactile and audible cues.",
    placeId: "place-northside-library",
    destination: "Platform 2 transfer",
    passportId: "passport-vision",
    objectiveIds: ["obj-route-planning", "obj-evidence-quality"],
    audience: ["individual"],
    stages: stages(
      "Use multimodal wayfinding. Text map: Concourse → TGSI spine to Platform 2 → assistance desk (hours unknown) → boarding zone.",
    ),
    decisionPoints: [
      {
        id: "dp-wayfinding",
        prompt: "Choose a transfer strategy.",
        options: [
          {
            id: "opt-tgsi",
            label:
              "Follow verified TGSI; treat audio as supportive; note unknown desk hours",
            predictedStatus: "suitable_with_conditions",
          },
          {
            id: "opt-visual-only",
            label: "Rely only on visual signs and ignore tactile evidence",
            predictedStatus: "suitable",
          },
          {
            id: "opt-invent-hours",
            label: "Assume assistance desk is open all night",
            predictedStatus: "suitable",
          },
        ],
        expectedOptionId: "opt-tgsi",
        rationale: "Prefer verified tactile path; keep desk hours unknown.",
      },
    ],
    dynamicEvents: [
      {
        id: "dyn-announcement-gap",
        title: "Announcement gap",
        description: "Temporary silence on Platform 2 speakers.",
        introducesIncidentId: "inc-audio-gap",
        triggerAfterStage: "decision",
      },
    ],
    evidenceIds: ["ev-tgsi", "ev-audio", "ev-staff"],
    unknownHighlights: ["Assistance desk hours are unknown"],
    expectedReasoning: [
      "TGSI path is verified",
      "Audio is partial support",
      "Desk hours remain unknown",
    ],
    formativeFeedback: {
      good: "You centred verified TGSI and kept desk hours unknown.",
      needs_work: "Do not invent desk hours or discard tactile evidence.",
    },
    teachBackPrompt:
      "Why is a verified tactile path still useful when audio is partial?",
    teachBackKeywords: ["tactile", "TGSI", "audio", "partial", "unknown"],
    reflectionPrompts: [
      "What would you ask staff without oversharing personal data?",
      "How would you phrase an unknown?",
    ],
    transferTask: {
      title: "Bus-to-train transfer",
      instructions: "Plan a bus-to-train transfer with partial audio evidence.",
      successCriteria: ["Names tactile/audible requirements", "Includes an unknown"],
    },
    rubric: BASE_RUBRIC,
    published: true,
    version: "1.0.0",
    ...publication,
  },
  {
    id: "respectful-reception",
    title: "Respectful reception communication",
    humanGoal: "Check in at reception with dignity-preserving communication.",
    placeId: "place-mapable-community-hub",
    destination: "Reception check-in",
    passportId: "passport-hearing",
    objectiveIds: ["obj-consent-privacy", "obj-requirement-recognition"],
    audience: ["workforce", "community"],
    stages: stages(
      "Practice consent-aware reception. Text map: Main queue → main counter (public) → side desk (verified quieter) → waiting seats.",
    ),
    decisionPoints: [
      {
        id: "dp-reception",
        prompt: "How should check-in proceed?",
        options: [
          {
            id: "opt-side-desk",
            label:
              "Request side desk; share only needed access info with consent; keep announcement policy unknown",
            predictedStatus: "suitable_with_conditions",
          },
          {
            id: "opt-announce",
            label: "Have reception loudly announce all access needs to the waiting room",
            predictedStatus: "suitable",
          },
          {
            id: "opt-assume-capacity",
            label:
              "Infer cognitive capacity from a mobility aid and speak to the companion only",
            predictedStatus: "suitable",
          },
        ],
        expectedOptionId: "opt-side-desk",
        rationale:
          "Use private check-in and consent; never infer capacity from disability markers.",
      },
    ],
    dynamicEvents: [],
    evidenceIds: ["ev-private-desk", "ev-script", "ev-masking"],
    unknownHighlights: ["Announcement policy for disability disclosure is unknown"],
    expectedReasoning: [
      "Side desk supports privacy",
      "Consent before assistance",
      "No capacity inference from disability",
    ],
    formativeFeedback: {
      good: "You protected privacy and avoided capacity inferences.",
      needs_work:
        "Public announcement of needs and capacity inference are not acceptable.",
    },
    teachBackPrompt:
      "Explain why capacity must not be inferred from a mobility aid.",
    teachBackKeywords: [
      "consent",
      "privacy",
      "capacity",
      "infer",
      "disability",
      "side desk",
    ],
    reflectionPrompts: [
      "What information is necessary vs optional to share?",
      "How would you correct a privacy miss?",
    ],
    transferTask: {
      title: "Consent request",
      instructions: "Draft a one-sentence consent request for reception assistance.",
      successCriteria: ["Asks permission", "Limits disclosure"],
    },
    rubric: BASE_RUBRIC,
    published: true,
    version: "1.0.0",
    ...publication,
  },
  {
    id: "privacy-venue-verification",
    title: "Privacy and venue verification",
    humanGoal: "Verify venue access features without oversharing personal data.",
    placeId: "place-riverside-hall",
    destination: "Rear accessible toilet path",
    passportId: "passport-step-free",
    objectiveIds: ["obj-consent-privacy", "obj-evidence-quality", "obj-uncertainty"],
    audience: ["community", "individual"],
    stages: stages(
      "Verify venue features with privacy-preserving questions. Text map: Street → claimed ramp (partial) → interior → accessible toilet (verified near rear).",
    ),
    decisionPoints: [
      {
        id: "dp-privacy",
        prompt: "How do you verify remaining unknowns with the venue?",
        options: [
          {
            id: "opt-minimal",
            label: "Ask only about ramp slope and toilet access; do not share diagnosis",
            predictedStatus: "suitable_with_conditions",
          },
          {
            id: "opt-overshare",
            label: "Send full medical history so they understand",
            predictedStatus: "suitable",
          },
          {
            id: "opt-fake-measure",
            label: "Treat the unverified ramp photo as measured proof",
            predictedStatus: "suitable",
          },
        ],
        expectedOptionId: "opt-minimal",
        rationale:
          "Minimise personal data; verify physical features; keep partial evidence partial.",
      },
    ],
    dynamicEvents: [],
    evidenceIds: ["ev-toilet", "ev-entry", "ev-staff-knows"],
    unknownHighlights: ["Staff knowledge of medical details is unnecessary and unknown"],
    expectedReasoning: [
      "Toilet verified",
      "Ramp remains partial until measured",
      "Do not overshare medical history",
    ],
    formativeFeedback: {
      good: "You verified features with minimal disclosure.",
      needs_work:
        "Do not overshare medical detail or promote partial photos to verified fact.",
    },
    teachBackPrompt:
      "What is the difference between access requirements and medical diagnosis when contacting a venue?",
    teachBackKeywords: [
      "privacy",
      "requirements",
      "diagnosis",
      "partial",
      "verified",
      "ramp",
    ],
    reflectionPrompts: [
      "Which fields belong in an Access Passport vs a verification call?",
      "How would you document a remaining unknown?",
    ],
    transferTask: {
      title: "Café step-free enquiry",
      instructions:
        "List three questions to ask a café about step-free entry without sharing health history.",
      successCriteria: [
        "Questions are spatial/operational",
        "Privacy-preserving",
      ],
    },
    rubric: BASE_RUBRIC,
    published: true,
    version: "1.0.0",
    ...publication,
  },
];

export function getScenarioById(id: string): LearningScenario | undefined {
  return LEARNING_SCENARIOS.find((s) => s.id === id);
}

export function listPublishedScenarios(): LearningScenario[] {
  return LEARNING_SCENARIOS.filter((s) => s.published);
}

export function getObjectiveById(id: string): LearningObjective | undefined {
  return LEARNING_OBJECTIVES.find((o) => o.id === id);
}
