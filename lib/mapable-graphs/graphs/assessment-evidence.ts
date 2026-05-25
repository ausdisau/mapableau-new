import { graphRepository } from "@/lib/mapable-graphs/repository";

const ASSESSMENT_TOOLS = [
  "WHODAS",
  "GMFCS",
  "MACS",
  "CFCS",
  "EDACS",
  "I-CAN",
  "sensory_profile",
  "goal_attainment_scaling",
  "environmental_access_assessment",
] as const;

export async function addAssessmentTool(
  participantId: string,
  tool: (typeof ASSESSMENT_TOOLS)[number] | string
) {
  return graphRepository.createNode({
    graphType: "assessment_evidence",
    nodeType: "AssessmentTool",
    participantId,
    label: tool,
    entityId: tool,
    status: "active",
    data: { nonDeterministic: true, cannotDecideEligibility: true },
  });
}

export async function addAssessmentResult(
  participantId: string,
  toolNodeId: string,
  label: string,
  resultData: Record<string, unknown>
) {
  const result = await graphRepository.createNode({
    graphType: "assessment_evidence",
    nodeType: "AssessmentResult",
    participantId,
    label,
    status: "recorded",
    data: {
      ...resultData,
      informsOnly: true,
      cannotAutoReduceSupport: true,
    },
  });
  await graphRepository.createEdge({
    graphType: "assessment_evidence",
    edgeType: "MEASURED_BY",
    fromNodeId: result.id,
    toNodeId: toolNodeId,
    participantId,
  });
  return result;
}

export async function linkAssessmentToFunctionalSignal(
  participantId: string,
  assessmentResultId: string,
  functionalSignalId: string
) {
  return graphRepository.createEdge({
    graphType: "assessment_evidence",
    edgeType: "INDICATES",
    fromNodeId: assessmentResultId,
    toNodeId: functionalSignalId,
    participantId,
    data: { nonDiagnostic: true },
  });
}

export async function linkFunctionalSignalToSupportNeed(
  participantId: string,
  functionalSignalId: string,
  supportNeedId: string
) {
  await graphRepository.createEdge({
    graphType: "assessment_evidence",
    edgeType: "CONTRIBUTES_TO",
    fromNodeId: functionalSignalId,
    toNodeId: supportNeedId,
    participantId,
  });
  return graphRepository.createEdge({
    graphType: "support_journey",
    edgeType: "ADDRESSES_NEED",
    fromNodeId: functionalSignalId,
    toNodeId: supportNeedId,
    participantId,
  });
}

export async function addDocumentEvidence(
  participantId: string,
  label: string,
  documentRef: string
) {
  return graphRepository.createNode({
    graphType: "assessment_evidence",
    nodeType: "DocumentEvidence",
    participantId,
    label,
    entityId: documentRef,
    data: { documentRef },
  });
}

export async function addParticipantNarrativeEvidence(
  participantId: string,
  narrative: string
) {
  return graphRepository.createNode({
    graphType: "assessment_evidence",
    nodeType: "DocumentEvidence",
    participantId,
    label: "Participant narrative",
    data: {
      narrative,
      source: "participant",
      nonDiagnostic: true,
    },
  });
}

export { ASSESSMENT_TOOLS };
