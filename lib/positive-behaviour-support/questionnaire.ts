import { assertUnknownRemainsUnknown } from "./invariants";
import {
  PBS_QUESTIONNAIRE_SECTIONS,
  type PbsAnswerStatus,
  type PbsQuestionnaireSection,
} from "./types";

export const PBS_QUESTIONNAIRE_VERSION = "pbs-questionnaire-v1";

export interface PbsQuestionnaireQuestion {
  id: string;
  section: PbsQuestionnaireSection;
  prompt: string;
  plainLanguage: string;
  easyRead: string;
  allowsUnknown: boolean;
  allowsSkip: boolean;
  branchingHint?: string;
}

/** Conventional accessible form definition — AI enhancement is optional. */
export const PBS_QUESTIONNAIRE_DEFINITION: PbsQuestionnaireQuestion[] = [
  {
    id: "q_comm_prefs",
    section: "communication_decision_making",
    prompt: "How do you prefer to communicate and make decisions about your supports?",
    plainLanguage: "Tell us how you like to talk and decide about your supports.",
    easyRead: "How do you like to talk and choose?",
    allowsUnknown: true,
    allowsSkip: true,
  },
  {
    id: "q_strengths",
    section: "strengths_interests_identity",
    prompt: "What are your strengths, interests, and important parts of your identity?",
    plainLanguage: "What are you good at, what do you enjoy, and what matters about who you are?",
    easyRead: "What are you good at? What do you like?",
    allowsUnknown: true,
    allowsSkip: true,
  },
  {
    id: "q_good_life",
    section: "good_life",
    prompt: "In your own words, what does a good life look like for you?",
    plainLanguage: "What would a good life look like for you?",
    easyRead: "What is a good life for you?",
    allowsUnknown: true,
    allowsSkip: true,
  },
  {
    id: "q_routines",
    section: "routines_relationships_environments",
    prompt: "Which routines, relationships, and places are important to you?",
    plainLanguage: "Tell us about your usual routines, important people, and places.",
    easyRead: "Who and what places are important?",
    allowsUnknown: true,
    allowsSkip: true,
  },
  {
    id: "q_health",
    section: "health_pain_sleep_medication_sensory",
    prompt: "Are there health, pain, sleep, medication, or sensory things supporters should know?",
    plainLanguage: "Share any health, pain, sleep, medication, or sensory needs that matter for support.",
    easyRead: "Do you have health, pain, sleep, or sensory needs?",
    allowsUnknown: true,
    allowsSkip: true,
  },
  {
    id: "q_observable",
    section: "observable_behaviour_descriptions",
    prompt: "Describe what can be seen or heard — without guessing why it happens.",
    plainLanguage: "Describe what people can see or hear. Do not guess the reason.",
    easyRead: "What can people see or hear?",
    allowsUnknown: true,
    allowsSkip: true,
    branchingHint: "Stay observational; do not locate the behaviour solely within the participant.",
  },
  {
    id: "q_frequency",
    section: "frequency_duration_intensity_context",
    prompt: "How often does it happen, for how long, how intense, and in what situations?",
    plainLanguage: "Tell us about how often, how long, how strong, and when or where.",
    easyRead: "How often? How long? When?",
    allowsUnknown: true,
    allowsSkip: true,
  },
  {
    id: "q_abc",
    section: "antecedent_behaviour_consequence",
    prompt: "What happens before, during, and after (ABC observations)?",
    plainLanguage: "What happens before, what happens, and what happens after?",
    easyRead: "Before, during, and after — what happens?",
    allowsUnknown: true,
    allowsSkip: true,
  },
  {
    id: "q_barriers",
    section: "environmental_systemic_barriers",
    prompt: "What environmental or system barriers get in the way?",
    plainLanguage: "What around the person or in services makes things harder?",
    easyRead: "What makes things harder around you?",
    allowsUnknown: true,
    allowsSkip: true,
  },
  {
    id: "q_proactive",
    section: "proactive_support_preferences",
    prompt: "What proactive supports do you prefer?",
    plainLanguage: "What help do you want before things get hard?",
    easyRead: "What help do you want first?",
    allowsUnknown: true,
    allowsSkip: true,
  },
  {
    id: "q_skills",
    section: "skills_communication_replacement",
    prompt: "Which skills, communication supports, or replacement behaviours matter?",
    plainLanguage: "What skills or other ways of communicating would help?",
    easyRead: "What skills or other ways would help?",
    allowsUnknown: true,
    allowsSkip: true,
  },
  {
    id: "q_response",
    section: "response_recovery_safety",
    prompt: "What response, recovery, and safety approaches work for you?",
    plainLanguage: "What should people do to help you feel safe and recover?",
    easyRead: "How can people help you feel safe?",
    allowsUnknown: true,
    allowsSkip: true,
  },
  {
    id: "q_rp_screen",
    section: "restrictive_practice_screening",
    prompt: "Is anyone considering limits on movement, choice, or access that might be a restrictive practice?",
    plainLanguage: "Are any limits on movement, choice, or access being considered? This creates a practitioner review — AI will not recommend anything.",
    easyRead: "Are there limits on what you can do? A practitioner must check.",
    allowsUnknown: true,
    allowsSkip: false,
    branchingHint: "Possible RP → high-priority practitioner review; suspend AI drafting for section.",
  },
  {
    id: "q_implementation",
    section: "implementation_responsibilities",
    prompt: "Who should do what when the plan is used day to day?",
    plainLanguage: "Who will help put the plan into action?",
    easyRead: "Who will help use the plan?",
    allowsUnknown: true,
    allowsSkip: true,
  },
  {
    id: "q_outcomes",
    section: "outcomes_and_review",
    prompt: "What outcomes matter, and how should the plan be reviewed?",
    plainLanguage: "What good changes matter, and when should we check the plan?",
    easyRead: "What good changes matter? When should we check?",
    allowsUnknown: true,
    allowsSkip: true,
  },
];

export interface PbsQuestionnaireResponseInput {
  questionId: string;
  section: PbsQuestionnaireSection;
  status: PbsAnswerStatus;
  valueText?: string | null;
  suppliedByUserId: string;
  informantRole: "participant" | "invited_informant" | "practitioner_note";
}

export function validateQuestionnaireResponse(
  input: PbsQuestionnaireResponseInput,
): void {
  if (!PBS_QUESTIONNAIRE_SECTIONS.includes(input.section)) {
    throw new Error(`Unknown questionnaire section: ${input.section}`);
  }
  const question = PBS_QUESTIONNAIRE_DEFINITION.find(
    (q) => q.id === input.questionId,
  );
  if (!question) {
    throw new Error(`Unknown question: ${input.questionId}`);
  }
  if (input.status === "unknown") {
    assertUnknownRemainsUnknown(input.status, null);
  }
  if (input.status === "skipped" && !question.allowsSkip) {
    throw new Error(`Question ${input.questionId} cannot be skipped`);
  }
  if (input.status === "unknown" && !question.allowsUnknown) {
    throw new Error(`Question ${input.questionId} does not allow unknown`);
  }
}

export function unansweredSections(
  answered: Iterable<PbsQuestionnaireSection>,
): PbsQuestionnaireSection[] {
  const set = new Set(answered);
  return PBS_QUESTIONNAIRE_SECTIONS.filter((s) => !set.has(s));
}

export function questionnaireCannotFinaliseAssessment(): true {
  return true;
}
