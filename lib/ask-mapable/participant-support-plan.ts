export const PARTICIPANT_SUPPORT_PLAN_FIELDS = [
  "noticeFirst",
  "thingsICanTry",
  "groundingPeoplePlaces",
  "peopleIChoose",
  "professionalSupports",
  "saferEnvironment",
  "communicationAccess",
] as const;

export type ParticipantSupportPlanField =
  (typeof PARTICIPANT_SUPPORT_PLAN_FIELDS)[number];

export type ParticipantSupportPlan = Record<ParticipantSupportPlanField, string>;

export type ConsentedSupportSummary = {
  selectedFields: ParticipantSupportPlanField[];
  sections: Array<{ label: string; value: string }>;
  sent: false;
  externalAcceptanceConfirmed: false;
};

const MAX_SECTION_LENGTH = 1200;

const FIELD_LABELS: Record<ParticipantSupportPlanField, string> = {
  noticeFirst: "What I notice first",
  thingsICanTry: "Things I can try",
  groundingPeoplePlaces: "People or places that help me feel grounded",
  peopleIChoose: "People I choose to ask for support",
  professionalSupports: "Professional or crisis supports I choose",
  saferEnvironment: "Things that make my environment feel safer",
  communicationAccess: "How I communicate",
};

function normaliseText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, MAX_SECTION_LENGTH);
}

function isSupportPlanField(value: string): value is ParticipantSupportPlanField {
  return (PARTICIPANT_SUPPORT_PLAN_FIELDS as readonly string[]).includes(value);
}

export function createEmptyParticipantSupportPlan(): ParticipantSupportPlan {
  return {
    noticeFirst: "",
    thingsICanTry: "",
    groundingPeoplePlaces: "",
    peopleIChoose: "",
    professionalSupports: "",
    saferEnvironment: "",
    communicationAccess: "",
  };
}

export function normaliseParticipantSupportPlan(
  input: Partial<Record<ParticipantSupportPlanField, unknown>>,
): ParticipantSupportPlan {
  const empty = createEmptyParticipantSupportPlan();
  for (const field of PARTICIPANT_SUPPORT_PLAN_FIELDS) {
    empty[field] = normaliseText(input[field]);
  }
  return empty;
}

/**
 * Builds an unsent preview containing only sections the participant explicitly
 * selected. This function does not persist, transmit, assess or score the plan.
 */
export function buildConsentedSupportSummary(input: {
  plan: ParticipantSupportPlan;
  selectedFields: readonly string[];
}): ConsentedSupportSummary | null {
  const selected = Array.from(
    new Set(input.selectedFields.filter(isSupportPlanField)),
  );

  const sections = selected
    .map((field) => ({
      field,
      label: FIELD_LABELS[field],
      value: normaliseText(input.plan[field]),
    }))
    .filter((section) => section.value.length > 0);

  if (sections.length === 0) return null;

  return {
    selectedFields: sections.map((section) => section.field),
    sections: sections.map(({ label, value }) => ({ label, value })),
    sent: false,
    externalAcceptanceConfirmed: false,
  };
}
