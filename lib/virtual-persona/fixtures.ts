import {
  PERSONA_TURN_SCHEMA_VERSION,
  type PersonaTurn,
} from "@/lib/virtual-persona/types";

function baseTurn(
  overrides: Partial<PersonaTurn> &
    Pick<PersonaTurn, "turnId" | "responseType" | "displayText">,
): PersonaTurn {
  return {
    schemaVersion: PERSONA_TURN_SCHEMA_VERSION,
    sourceReferences: [
      {
        id: "fixture-public-info",
        label: "Synthetic MapAble public information fixture (not a live record)",
        evidenceStatus: "synthetic_fixture",
      },
    ],
    evidenceStatus: "synthetic_fixture",
    uncertainties: [],
    suggestedQuestions: [],
    editableDraft: null,
    requiresHumanReview: false,
    actionAuthority: "none",
    canUseNonAiFallback: true,
    ...overrides,
  };
}

export const SYNTHETIC_PUBLIC_INFO_TURN = (turnId: string): PersonaTurn =>
  baseTurn({
    turnId,
    responseType: "informational",
    displayText:
      "MapAble helps people find accessibility information and disability support options. This reply uses synthetic fixtures only. It is AI-assisted wording for demonstration and may be incomplete or wrong. You decide what to do next.",
    uncertainties: [
      "This demonstration does not look up your personal plan or providers.",
    ],
    suggestedQuestions: [
      "How do I ask for human support?",
      "Can I draft a support request without sending it?",
    ],
  });

export const SYNTHETIC_UNCERTAIN_TURN = (turnId: string): PersonaTurn =>
  baseTurn({
    turnId,
    responseType: "informational",
    displayText:
      "I do not have verified information for that question in this synthetic demo. I will not invent a service record or claim a source I do not have.",
    evidenceStatus: "missing",
    sourceReferences: [
      {
        id: "no-source",
        label: "No verified source available in fixtures",
        evidenceStatus: "missing",
      },
    ],
    uncertainties: [
      "No live ParticipantRAG or ProviderRAG is connected in P02.",
    ],
    suggestedQuestions: [
      "Show me the non-AI alternative",
      "How do I contact a human?",
    ],
    requiresHumanReview: true,
  });

export const SYNTHETIC_DRAFT_TURN = (turnId: string): PersonaTurn =>
  baseTurn({
    turnId,
    responseType: "draft_support_request",
    displayText:
      "Here is an editable draft you can change. Nothing is sent, booked, or approved from this screen. actionAuthority remains none.",
    editableDraft: {
      title: "Draft support request (not sent)",
      body: "I would like help exploring support options for daily activities. Please do not contact anyone until I approve.",
      executable: false,
    },
    suggestedQuestions: ["How do I reject this draft?", "Use the non-AI path"],
    requiresHumanReview: true,
  });

export const SYNTHETIC_CLARIFY_TURN = (turnId: string): PersonaTurn =>
  baseTurn({
    turnId,
    responseType: "clarification",
    displayText:
      "Could you say a little more about what you want to understand? You can type with AAC or assistive input at your own pace—there is no time limit.",
    evidenceStatus: "not_applicable",
    sourceReferences: [],
  });

export const SYNTHETIC_REFUSAL_TURN = (turnId: string): PersonaTurn =>
  baseTurn({
    turnId,
    responseType: "refusal",
    displayText:
      "I cannot book services, change permissions, decide NDIS funding, or make clinical recommendations. Those actions stay with you and authorised MapAble services—not this persona.",
    evidenceStatus: "not_applicable",
    sourceReferences: [],
    requiresHumanReview: true,
    suggestedQuestions: ["Draft a request instead", "Show non-AI options"],
  });

export const SYNTHETIC_FALLBACK_TURN = (turnId: string): PersonaTurn =>
  baseTurn({
    turnId,
    responseType: "fallback",
    displayText:
      "AI assistance is off or unavailable. You can use MapAble’s classic search and support pages without this persona, or ask for human help.",
    evidenceStatus: "not_applicable",
    sourceReferences: [],
    canUseNonAiFallback: true,
  });

export const PROHIBITED_ACTION_PATTERNS = [
  /\bbook\b/i,
  /\bpay\b/i,
  /\bpayment\b/i,
  /\bgrant\b.+\b(role|permission|access)\b/i,
  /\brevoke\b.+\b(consent|permission)\b/i,
  /\bassign\b.+\b(worker|provider)\b/i,
  /\bdiagnos/i,
  /\bfunding\b.+\b(approv|determin)/i,
] as const;
