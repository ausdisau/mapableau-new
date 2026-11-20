/**
 * Public design previews only. These descriptions do not change feature flags,
 * authorise a booking/payment, or assert that a pilot or partner is live.
 */
export type PublicRoadmapModule =
  | "care"
  | "employment"
  | "foods"
  | "moves"
  | "kids"
  | "marketplace"
  | "peer"
  | "telehealth";

export type PlannedJourney = {
  title: string;
  outcome: string;
  steps: readonly string[];
  releaseGate: string;
  recovery: string;
};

export const PUBLIC_PLANNED_JOURNEYS: Record<PublicRoadmapModule, PlannedJourney> = {
  care: {
    title: "Request support while retaining control",
    outcome: "A participant can ask a verified provider about support without an automatic worker assignment.",
    steps: [
      "Specify tasks, timing and preferred communication.",
      "Review exactly which details a provider would receive and approve consent.",
      "Compare provider responses, request changes, withdraw or seek human assistance.",
    ],
    releaseGate: "Verified recipient, purpose-scoped consent, worker-eligibility checks and a safe no-match path.",
    recovery: "An unanswered or declined enquiry remains unbooked, with accessible human follow-up.",
  },
  employment: {
    title: "Discover work without compulsory disclosure",
    outcome: "Applicants can use a skills-first profile and request adjustments on their own terms.",
    steps: [
      "Explore source-labelled vacancies using skills and accessible-workplace filters.",
      "Preview each profile field and optional adjustment request before sharing.",
      "Track applications, employer responses and any outstanding adjustments.",
    ],
    releaseGate: "Employer verification, privacy-isolated adjustment records and accessible recruitment testing.",
    recovery: "Export the application or contact a person if the employer integration fails.",
  },
  foods: {
    title: "Order food with a clear safety and cost breakdown",
    outcome: "A participant can compare meals or groceries while controlling dietary disclosures.",
    steps: [
      "Browse items with ingredient, access and dietary information.",
      "Review food, preparation, delivery and support charges separately.",
      "Confirm vendor availability and explicitly approve the order.",
    ],
    releaseGate: "Food-safety operations, allergen controls, vendor verification, total-price validation and refunds.",
    recovery: "Do not charge for unavailable or uncertain items; route safety concerns to a human.",
  },
  moves: {
    title: "Coordinate therapy without losing clinical privacy",
    outcome: "A participant can search qualified practitioners and plan optional care and travel.",
    steps: [
      "Filter practitioners by discipline, professional scope and accessibility.",
      "Enquire about an appointment and optional transport as separate decisions.",
      "Review practitioner-authored records and consent to any additional sharing.",
    ],
    releaseGate: "Current professional verification, clinical oversight, health-data permissions and rescheduling.",
    recovery: "Offer a direct enquiry and independent cancellation path when scheduling fails.",
  },
  kids: {
    title: "Find child-safe supports with participation built in",
    outcome: "Families and children can explore early supports without publishing a child's sensitive profile.",
    steps: [
      "Discover activities and providers using child-appropriate access filters.",
      "Check authority, communication preferences and the child's evolving choices.",
      "Approve an individual enquiry and share only the required information.",
    ],
    releaseGate: "Child-safety governance, lawful guardian authority, assent practices and human review.",
    recovery: "Pause sharing when authority or suitability is uncertain and contact safeguarding staff.",
  },
  marketplace: {
    title: "Compare equipment before a controlled purchase",
    outcome: "A buyer can assess vendor provenance, product risks and fees without a claim of NDIS approval.",
    steps: [
      "Filter products by verified dimensions, condition and accessibility attributes.",
      "Review seller verification, recalls, suitability limits and itemised costs.",
      "Opt in to community or support links; use only authorised sandbox checkout.",
    ],
    releaseGate: "Seller checks, recalls, consumer-law controls, funding-neutral invoices and refund operations.",
    recovery: "Withdraw unsafe listings and provide a dispute route; no automatic NDIS claims.",
  },
  peer: {
    title: "Learn from peers with accountable moderation",
    outcome: "People can share lived experience without compulsory identity exposure or popularity ranking.",
    steps: [
      "Choose a pseudonym, topic circle and preferred accessible format.",
      "Review community rules and consent before sharing a story or question.",
      "Use a private report and appeal process when content causes concern.",
    ],
    releaseGate: "Trained moderators, privacy safeguards, reporting operations and non-retaliatory escalation.",
    recovery: "Hold harmful content for human review while protecting member privacy.",
  },
  telehealth: {
    title: "Prepare for a remote appointment accessibly",
    outcome: "Participants can review consent and communication needs before a time-limited remote session.",
    steps: [
      "Receive accessible reminders and check preferred communication and connectivity.",
      "Review privacy choices and the practitioner's role before entering a waiting room.",
      "Join when ready, then review attendance evidence without automatic recording.",
    ],
    releaseGate: "Scoped room tokens, practitioner verification, clinical safety, audit and no-video alternatives.",
    recovery: "Offer a phone or reschedule route if access or the connection fails.",
  },
};
