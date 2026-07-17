/**
 * Versioned NDIS digital platform applicability questionnaire.
 * Answers inform human review; they never produce a definitive legal classification.
 */

export const SCOPE_QUESTIONNAIRE_VERSION = "mapable-platform-scope-v1-2026-07-16";

export type ScopeQuestionId =
  | "is_online_system"
  | "acts_as_intermediary"
  | "connects_participants_to_ndis_supports"
  | "processes_plan_payments"
  | "main_purpose_is_connecting"
  | "primarily_directory_or_saas"
  | "primarily_provider_or_employer"
  | "primarily_transport_or_venue"
  | "evidence_complete";

export type ScopeAnswerValue = "yes" | "no" | "unknown" | "not_applicable";

export type ScopeQuestion = {
  id: ScopeQuestionId;
  prompt: string;
  helpText: string;
};

export const SCOPE_QUESTIONS: ScopeQuestion[] = [
  {
    id: "is_online_system",
    prompt: "Is this MapAble function an online application, site or system?",
    helpText: "Includes web and mobile surfaces that participants or workers use.",
  },
  {
    id: "acts_as_intermediary",
    prompt: "Does the function act as an intermediary between parties?",
    helpText: "For example matching, booking, or messaging between participant and worker.",
  },
  {
    id: "connects_participants_to_ndis_supports",
    prompt:
      "Does it connect NDIS participants with people providing NDIS supports?",
    helpText: "Profile-based connection is central to Commission platform-provider descriptions.",
  },
  {
    id: "processes_plan_payments",
    prompt:
      "Does it process payments using amounts from participant plans?",
    helpText: "Include platform fees charged against plan-funded bookings if applicable.",
  },
  {
    id: "main_purpose_is_connecting",
    prompt:
      "Is connecting participants to NDIS supports the main purpose of this function?",
    helpText: "If the main purpose is information, SaaS, or venue access, answer no.",
  },
  {
    id: "primarily_directory_or_saas",
    prompt:
      "Is the function primarily a directory, SaaS supplier, or information service?",
    helpText: "Supports mixed-function review when combined with marketplace features.",
  },
  {
    id: "primarily_provider_or_employer",
    prompt:
      "Is MapAble primarily acting as a provider or employer for this function?",
    helpText: "Distinct from intermediating independent workers.",
  },
  {
    id: "primarily_transport_or_venue",
    prompt:
      "Is the function primarily a transport operator or venue platform?",
    helpText: "Access map and journey tools may fall here depending on facts.",
  },
  {
    id: "evidence_complete",
    prompt: "Is supporting evidence attached and sufficient for legal review?",
    helpText: "If unknown or no, result should remain insufficient or legal review required.",
  },
];

export type ScopeAnswers = Partial<Record<ScopeQuestionId, ScopeAnswerValue>>;

export type SuggestedScopeResult =
  | "likely_in_scope"
  | "likely_out_of_scope"
  | "mixed_function_review_required"
  | "insufficient_evidence"
  | "legal_review_required";

/**
 * Deterministic suggestion only. Never a legal conclusion.
 * Any marketplace-like pattern with incomplete evidence → legal_review_required.
 */
export function suggestScopeResult(answers: ScopeAnswers): SuggestedScopeResult {
  const unknownCount = SCOPE_QUESTIONS.filter(
    (q) => !answers[q.id] || answers[q.id] === "unknown"
  ).length;

  if (unknownCount > 0 || answers.evidence_complete !== "yes") {
    if (
      answers.connects_participants_to_ndis_supports === "yes" ||
      answers.processes_plan_payments === "yes" ||
      answers.main_purpose_is_connecting === "yes"
    ) {
      return "legal_review_required";
    }
    return "insufficient_evidence";
  }

  const marketplaceSignals =
    answers.is_online_system === "yes" &&
    answers.acts_as_intermediary === "yes" &&
    answers.connects_participants_to_ndis_supports === "yes";

  const altSignals =
    answers.primarily_directory_or_saas === "yes" ||
    answers.primarily_provider_or_employer === "yes" ||
    answers.primarily_transport_or_venue === "yes";

  if (marketplaceSignals && altSignals) {
    return "mixed_function_review_required";
  }

  if (
    marketplaceSignals &&
    answers.main_purpose_is_connecting === "yes" &&
    answers.processes_plan_payments === "yes"
  ) {
    // Still not a legal conclusion — force legal review for high-signal cases.
    return "legal_review_required";
  }

  if (marketplaceSignals) {
    return "legal_review_required";
  }

  if (altSignals && answers.connects_participants_to_ndis_supports === "no") {
    return "likely_out_of_scope";
  }

  return "insufficient_evidence";
}
