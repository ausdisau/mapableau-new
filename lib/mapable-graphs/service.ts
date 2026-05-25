import {
  addAssessmentResult,
  addAssessmentTool,
  addDocumentEvidence,
  addParticipantNarrativeEvidence,
  linkAssessmentToFunctionalSignal,
  linkFunctionalSignalToSupportNeed,
} from "@/lib/mapable-graphs/graphs/assessment-evidence";
import {
  addCareBookingDraft,
  addEmploymentEvent,
  addTransportBookingDraft,
  createBookingGraphForSession,
  linkBookingDependency,
  markBookingConfirmed,
  markBookingFailed,
  recordTimingIssue,
  validateBookingDependencies,
} from "@/lib/mapable-graphs/graphs/booking-graph";
import {
  checkConsentForAction,
  createConsentRecord,
  listActiveConsents,
  revokeConsentScope,
} from "@/lib/mapable-graphs/graphs/consent-graph";
import {
  recordComplaint,
  recordLearningSignal,
  recordParticipantConfirmation,
  recordParticipantEdit,
  recordParticipantRejection,
} from "@/lib/mapable-graphs/graphs/feedback-graph";
import {
  escalateSafeguarding,
  evaluateActionAgainstRulesGraph,
  recordPolicyDecision,
} from "@/lib/mapable-graphs/graphs/guardrail-graph";
import {
  generateOutcomeSummary,
  linkOutcomeToBooking,
  linkOutcomeToGoal,
  recordGoalProgress,
  recordServiceOutcome,
} from "@/lib/mapable-graphs/graphs/outcome-graph";
import { grantConsentScope } from "@/lib/mapable-graphs/graphs/consent-graph";
import {
  addEnvironmentalBarrier,
  addFunctionalSignal,
  addParticipantGoal,
  addParticipantPreference,
  applyParticipantCorrection,
  confirmInterpretation,
  createParticipantJourneyGraph,
} from "@/lib/mapable-graphs/graphs/participant-journey";
import {
  checkWorkerSuitability,
  inferRequiredCapabilities,
} from "@/lib/mapable-graphs/graphs/provider-capability-graph";
import {
  confirmSupportNeedGraph,
  createServicePlan,
  createSupportJourney,
  generateRecommendation,
  inferSupportNeedFromLLM,
  linkServicePlanToBookings,
  rejectSupportNeedGraph,
} from "@/lib/mapable-graphs/graphs/support-journey";
import { classifySupportFromQuery } from "@/lib/mapable-graphs/llm-integration";
import { graphRepository, GraphRepository } from "@/lib/mapable-graphs/repository";
import {
  buildCPSimInputFromGraphs,
  buildMDSimInputFromGraphs,
} from "@/lib/mapable-graphs/sim-integration";
import type {
  GraphNode,
  GraphType,
  SupportClassificationOutput,
} from "@/lib/mapable-graphs/types";

export class GraphService {
  constructor(private readonly repo: GraphRepository = graphRepository) {}

  createNode = this.repo.createNode.bind(this.repo);
  updateNode = this.repo.updateNode.bind(this.repo);
  getNode = this.repo.getNode.bind(this.repo);
  findNodes = this.repo.findNodes.bind(this.repo);
  createEdge = this.repo.createEdge.bind(this.repo);
  deleteEdge = this.repo.deleteEdge.bind(this.repo);
  findEdges = this.repo.findEdges.bind(this.repo);
  getGraphForParticipant = this.repo.getGraphForParticipant.bind(this.repo);
  getNeighbourhood = this.repo.getNeighbourhood.bind(this.repo);
  recordGraphEvent = this.repo.recordGraphEvent.bind(this.repo);
  createSnapshot = this.repo.createSnapshot.bind(this.repo);
  getLatestSnapshot = this.repo.getLatestSnapshot.bind(this.repo);

  async upsertParticipantGoal(
    participantId: string,
    label: string,
    key?: string,
    actorId?: string
  ) {
    await createParticipantJourneyGraph(participantId, actorId);
    const existing = await this.repo.findNodes({
      graphType: "participant_journey",
      participantId,
      nodeType: "Goal",
      entityId: key,
    });
    if (existing[0]) {
      return this.repo.updateNode(existing[0].id, { label, status: "draft" });
    }
    return addParticipantGoal(participantId, label, key, actorId);
  }

  async upsertSupportNeed(
    participantId: string,
    label: string,
    key?: string,
    actorId?: string
  ) {
    await createSupportJourney(participantId, actorId);
    const existing = await this.repo.findNodes({
      graphType: "support_journey",
      participantId,
      nodeType: "SupportNeed",
      entityId: key,
    });
    if (existing[0]) {
      return this.repo.updateNode(existing[0].id, { label });
    }
    return this.repo.createNode({
      graphType: "support_journey",
      nodeType: "SupportNeed",
      participantId,
      label,
      entityId: key,
      status: "draft",
      data: { key, requiresConfirmation: true },
      createdBy: actorId,
    });
  }

  confirmSupportNeed = confirmSupportNeedGraph;
  rejectSupportNeed = rejectSupportNeedGraph;

  async linkAssessmentToSupportNeed(
    participantId: string,
    assessmentResultId: string,
    supportNeedId: string,
    functionalSignalId?: string
  ) {
    if (functionalSignalId) {
      await linkAssessmentToFunctionalSignal(
        participantId,
        assessmentResultId,
        functionalSignalId
      );
      return linkFunctionalSignalToSupportNeed(
        participantId,
        functionalSignalId,
        supportNeedId
      );
    }
    return this.repo.createEdge({
      graphType: "assessment_evidence",
      edgeType: "CONTRIBUTES_TO",
      fromNodeId: assessmentResultId,
      toNodeId: supportNeedId,
      participantId,
    });
  }

  async linkRecommendationToSupportNeed(
    participantId: string,
    recommendationId: string,
    supportNeedId: string
  ) {
    return this.repo.createEdge({
      graphType: "support_journey",
      edgeType: "RECOMMENDED_BECAUSE_OF",
      fromNodeId: recommendationId,
      toNodeId: supportNeedId,
      participantId,
    });
  }

  async createSupportPlanFromRecommendations(
    participantId: string,
    title: string,
    recommendationIds: string[],
    actorId?: string
  ) {
    const plan = await createServicePlan(
      participantId,
      title,
      recommendationIds,
      actorId
    );
    await this.recordGraphEvent({
      graphType: "support_journey",
      participantId,
      eventType: "service_plan.created",
      relatedNodeId: plan.id,
      actorId,
      payload: { requiresConfirmationBeforeBooking: true },
    });
    return plan;
  }

  async linkBookingToSupportPlan(
    participantId: string,
    planNodeId: string,
    bookingNodeIds: string[]
  ) {
    return linkServicePlanToBookings(participantId, planNodeId, bookingNodeIds);
  }

  recordOutcome = recordServiceOutcome;

  recordConsent = grantConsentScope;
  revokeConsent = revokeConsentScope;

  async recordGuardrailDecision(
    participantId: string,
    action: string,
    context?: Record<string, unknown>,
    actorId?: string
  ) {
    const evaluation = await evaluateActionAgainstRulesGraph(
      participantId,
      action,
      context
    );
    return recordPolicyDecision(participantId, evaluation, action, actorId);
  }

  recordFeedback = recordParticipantEdit;

  async buildParticipantVisibleJourneySummary(participantId: string) {
    const [journey, support, guardrailCheck] = await Promise.all([
      this.repo.getGraphForParticipant("participant_journey", participantId),
      this.repo.getGraphForParticipant("support_journey", participantId),
      evaluateActionAgainstRulesGraph(
        participantId,
        "display journey summary",
        {}
      ),
    ]);

    const goals = journey.nodes.filter((n) => n.nodeType === "Goal");
    const preferences = journey.nodes.filter(
      (n) => n.nodeType === "Preference" && n.status === "participant_confirmed"
    );
    const signals = journey.nodes.filter(
      (n) =>
        n.nodeType === "FunctionalSignal" ||
        n.nodeType === "EnvironmentalBarrier"
    );
    const supportNeeds = support.nodes.filter((n) => n.nodeType === "SupportNeed");
    const pendingConfirmation = supportNeeds.filter(
      (n) => n.status === "draft"
    ).length;

    return {
      goals: goals.map((g) => ({
        id: g.id,
        label: g.label,
        status: g.status,
      })),
      confirmedPreferences: preferences.map((p) => p.label),
      functionalAndSupportSignals: signals.map((s) => ({
        type: s.nodeType,
        label: s.label,
        status: s.status,
      })),
      supportNeeds: supportNeeds.map((n) => ({
        id: n.id,
        label: n.label,
        status: n.status,
      })),
      pendingConfirmationCount: pendingConfirmation,
      recentChanges: journey.nodes
        .slice(0, 5)
        .map((n) => ({ label: n.label, updatedAt: n.updatedAt })),
      guardrail: guardrailCheck,
      plainLanguage:
        "This is your support story. You can confirm, edit, or reject any suggestion. Nothing is booked or shared without your say-so.",
    };
  }

  async syncFromLlmClassification(
    participantId: string,
    query: string,
    actorId?: string
  ): Promise<{
    classification: SupportClassificationOutput;
    guardrail: Awaited<ReturnType<typeof recordPolicyDecision>>;
    checkpointRequired: boolean;
  }> {
    const inferred = await inferSupportNeedFromLLM(
      participantId,
      query,
      actorId
    );

    for (const goal of inferred.classification.goals) {
      await this.upsertParticipantGoal(
        participantId,
        goal.label,
        goal.key,
        actorId
      );
    }

    const guardrail = await this.recordGuardrailDecision(
      participantId,
      `classify support: ${query}`,
      {
        riskFlags: inferred.classification.riskFlags,
        inferred: true,
      },
      actorId
    );

    await this.recordGraphEvent({
      graphType: "participant_journey",
      participantId,
      eventType: "llm.classification.synced",
      actorId,
      payload: {
        classification: inferred.classification,
        auditOnly: true,
      },
    });

    return {
      classification: inferred.classification,
      guardrail,
      checkpointRequired:
        guardrail.data.riskTier === "tier_4" ||
        Boolean((guardrail.data as { checkpointRequired?: boolean }).checkpointRequired),
    };
  }

  async onParticipantConfirmed(
    participantId: string,
    nodeIds: string[],
    actorId?: string
  ) {
    for (const nodeId of nodeIds) {
      await confirmInterpretation(participantId, nodeId, actorId);
      const node = await this.repo.getNode(nodeId);
      if (node?.nodeType === "SupportNeed") {
        await confirmSupportNeedGraph(participantId, nodeId, actorId);
      }
    }
    await this.recordGraphEvent({
      graphType: "support_journey",
      participantId,
      eventType: "participant.batch_confirmed",
      actorId,
      actorType: "participant",
    });
  }

  buildCPSimInput = (participantId: string) =>
    buildCPSimInputFromGraphs(this.repo, participantId);

  buildMDSimInput = (participantId: string) =>
    buildMDSimInputFromGraphs(this.repo, participantId);
}

export const graphService = new GraphService();

// Re-export domain helpers for API routes
export {
  createParticipantJourneyGraph,
  addParticipantGoal,
  addParticipantPreference,
  addFunctionalSignal,
  addEnvironmentalBarrier,
  confirmInterpretation,
  applyParticipantCorrection,
  createSupportJourney,
  inferSupportNeedFromLLM,
  generateRecommendation,
  createBookingGraphForSession,
  addCareBookingDraft,
  addTransportBookingDraft,
  addEmploymentEvent,
  linkBookingDependency,
  validateBookingDependencies,
  generateOutcomeSummary,
  checkConsentForAction,
  listActiveConsents,
  createConsentRecord,
  evaluateActionAgainstRulesGraph,
  recordComplaint,
  recordParticipantConfirmation,
  recordParticipantRejection,
  checkWorkerSuitability,
  inferRequiredCapabilities,
  addAssessmentTool,
  addAssessmentResult,
  addParticipantNarrativeEvidence,
  linkAssessmentToFunctionalSignal,
  linkFunctionalSignalToSupportNeed,
  classifySupportFromQuery,
  grantConsentScope,
  recordPolicyDecision,
  escalateSafeguarding,
  recordServiceOutcome,
  recordGoalProgress,
  linkOutcomeToGoal,
  linkOutcomeToBooking,
  confirmSupportNeedGraph,
  rejectSupportNeedGraph,
  markBookingConfirmed,
  markBookingFailed,
  recordTimingIssue,
  addDocumentEvidence,
  recordLearningSignal,
  recordParticipantEdit,
};
