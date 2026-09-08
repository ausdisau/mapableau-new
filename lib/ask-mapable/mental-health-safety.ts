import {
  highPriorityCrisisActions,
  nonImmediateCrisisActions,
} from "@/lib/ask-mapable/crisis-referrals";
import type { CopilotAskResponse } from "@/lib/copilot/types";

export type MentalHealthSafetyState =
  | "none"
  | "distress"
  | "suicidal_concern"
  | "immediate_danger";

export type MentalHealthSafetyAssessment = {
  state: MentalHealthSafetyState;
  matchedSignals: string[];
  requiresHumanReview: boolean;
  requiresEmergencyAdvice: boolean;
};

const DISTRESS_PATTERNS = [
  /\b(i(?:'m| am) hopeless|i feel hopeless|nothing matters|can't cope|cannot cope|overwhelmed|i'm not okay|i am not okay|i feel broken|life feels pointless)\b/i,
] as const;

const SUICIDAL_PATTERNS = [
  /\b(kill myself|suicide|suicidal|end my life|want to die|wish i was dead|better off dead|self harm|self-harm|hurt myself|can't go on|cannot go on)\b/i,
] as const;

const IMMEDIATE_DANGER_PATTERNS = [
  /\b(right now|tonight|today|immediately|about to|going to do it|can't stop myself|cannot stop myself)\b/i,
  /\b(i have (?:a )?plan|i made (?:a )?plan|i know how|i have the means|i have what i need)\b/i,
  /\b(i already hurt myself|i have already hurt myself|i took .* pills|i overdosed|i'm bleeding|i am bleeding)\b/i,
] as const;

const SAFETY_FOLLOW_UP_PATTERN =
  /\b(are you in immediate danger|might hurt yourself|stay safe|already hurt yourself|call 000)\b/i;

const FOLLOW_UP_IMMEDIATE =
  /^\s*(yes|yeah|yep|i am|i might|maybe|probably|i'm not sure|i am not sure|not sure|i don't know|i do not know)\s*[.!?]*\s*$/i;

function matchesAny(text: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function priorAssistantAskedSafetyQuestion(
  messages?: { role: "user" | "assistant"; content: string }[],
): boolean {
  if (!messages?.length) return false;
  const lastAssistant = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");
  return Boolean(
    lastAssistant && SAFETY_FOLLOW_UP_PATTERN.test(lastAssistant.content),
  );
}

export function assessMentalHealthSafety(
  text: string,
  messages?: { role: "user" | "assistant"; content: string }[],
): MentalHealthSafetyAssessment {
  const matchedSignals: string[] = [];
  const suicidal = matchesAny(text, SUICIDAL_PATTERNS);
  const immediate = suicidal && matchesAny(text, IMMEDIATE_DANGER_PATTERNS);
  const distress = matchesAny(text, DISTRESS_PATTERNS);
  const followUpImmediate =
    priorAssistantAskedSafetyQuestion(messages) && FOLLOW_UP_IMMEDIATE.test(text);

  if (suicidal) matchedSignals.push("explicit_suicidal_or_self_harm_language");
  if (immediate) matchedSignals.push("possible_immediate_danger");
  if (distress) matchedSignals.push("explicit_distress_language");
  if (followUpImmediate) matchedSignals.push("safety_question_uncertain_or_affirmative_reply");

  if (immediate || followUpImmediate) {
    return {
      state: "immediate_danger",
      matchedSignals,
      requiresHumanReview: true,
      requiresEmergencyAdvice: true,
    };
  }

  if (suicidal) {
    return {
      state: "suicidal_concern",
      matchedSignals,
      requiresHumanReview: true,
      requiresEmergencyAdvice: false,
    };
  }

  if (distress) {
    return {
      state: "distress",
      matchedSignals,
      requiresHumanReview: false,
      requiresEmergencyAdvice: false,
    };
  }

  return {
    state: "none",
    matchedSignals: [],
    requiresHumanReview: false,
    requiresEmergencyAdvice: false,
  };
}

/**
 * Builds a deterministic pre-model response for explicit suicide/self-harm
 * concern. This is not a diagnosis and not a prediction of future suicide.
 */
export function buildMentalHealthSafetyResponse(
  assessment: MentalHealthSafetyAssessment,
): CopilotAskResponse | null {
  if (assessment.state === "none" || assessment.state === "distress") {
    return null;
  }

  if (assessment.state === "immediate_danger") {
    return {
      source: "mapable-copilot",
      intent: "health",
      confidence: 1,
      summary: "Immediate safety concern",
      answer:
        "I'm concerned you may be in immediate danger. If you might act on this now, or you have already hurt yourself, call 000 now or ask someone nearby to call for you. Lifeline and Suicide Call Back Service are also available 24/7. If speaking by phone is difficult, the crisis-support page includes text, chat, video and National Relay Service options. I can stay with the conversation while you get human help, but I cannot safely assess or manage this on my own.",
      filters: {
        mentalHealthSafety: {
          state: assessment.state,
          screening: "high_signal_guardrail_only",
          prediction: false,
          referralAcceptanceClaimed: false,
        },
      },
      actions: highPriorityCrisisActions(),
      draftRecords: [],
      requiredConfirmations: [],
      warnings: [
        {
          level: "urgent",
          message:
            "This is an emergency-safety response, not a clinical diagnosis or suicide prediction.",
        },
      ],
      blockedActions: [],
      suggestedPrompts: [
        "Help me contact someone I trust",
        "Stay with me while I get help",
      ],
      askMeta: {
        brand: "Ask MapAble",
        specialistPrimary: "safeguarding",
        specialistReason:
          "Explicit language or a safety-question reply indicated possible immediate self-harm or suicide danger.",
      },
    };
  }

  return {
    source: "mapable-copilot",
    intent: "health",
    confidence: 1,
    summary: "Safety check",
    answer:
      "Thank you for telling me. I want to take this seriously without making assumptions. Are you in immediate danger of hurting yourself right now, or have you already hurt yourself? If yes or you're not sure you can stay safe, call 000 now. Lifeline and Suicide Call Back Service are also available, and the crisis-support page includes text, chat, video, relay and state mental-health triage pathways. I can keep talking with you, but a qualified human should assess suicide risk.",
    filters: {
      mentalHealthSafety: {
        state: assessment.state,
        screening: "high_signal_guardrail_only",
        prediction: false,
        referralAcceptanceClaimed: false,
      },
    },
    actions: nonImmediateCrisisActions(),
    draftRecords: [],
    requiredConfirmations: [],
    warnings: [
      {
        level: "warning",
        message:
          "MapAble does not convert this conversation into a suicide-risk score or diagnosis.",
      },
    ],
    blockedActions: [],
    suggestedPrompts: [
      "Yes, I might hurt myself now",
      "No, I'm not in immediate danger",
      "I'm not sure",
      "Help me talk to someone",
    ],
    askMeta: {
      brand: "Ask MapAble",
      specialistPrimary: "safeguarding",
      specialistReason:
        "Explicit suicidal or self-harm language requires a human safety pathway.",
    },
  };
}
