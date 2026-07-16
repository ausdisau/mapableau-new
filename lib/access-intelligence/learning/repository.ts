import { AccessIntelligenceError } from "../errors";

import {
  evaluateDecisionAgainstRubric,
  evaluateTeachBackText,
  getHint,
  nextMasteryLevel,
} from "./rubric";
import {
  getObjectiveById,
  getScenarioById,
  LEARNING_EVIDENCE,
  LEARNING_OBJECTIVES,
  listPublishedScenarios,
} from "./scenarios";
import type {
  ContentReview,
  FacilitatedSession,
  FieldMission,
  LearningMode,
  LearningObjective,
  LearningPreferences,
  LearningScenario,
  LearningStage,
  MasteryRecord,
  PracticeSession,
  RubricEvaluation,
} from "./schemas";
import {
  assertValidTransition,
  canRevealEvidence,
  nextStage,
} from "./state-machine";

function now() {
  return new Date().toISOString();
}

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

const preferencesStore = new Map<string, LearningPreferences>();
const sessionsStore = new Map<string, PracticeSession>();
const masteryStore = new Map<string, MasteryRecord>();
const facilitateStore = new Map<string, FacilitatedSession>();
const fieldMissionsStore = new Map<string, FieldMission>();
const contentReviewsStore = new Map<string, ContentReview>();
const authorDraftsStore = new Map<string, LearningScenario>();
const selectedObjectivesStore = new Map<string, string>();

function masteryKey(userId: string, conceptId: string) {
  return `${userId}::${conceptId}`;
}

export class LearningRepository {
  loadLearningPreferences(userId: string): LearningPreferences {
    const existing = preferencesStore.get(userId);
    if (existing) return existing;
    const prefs: LearningPreferences = {
      userId,
      preferredMode: "plan",
      plainLanguage: true,
      requirePredictionBeforeEvidence: true,
      hintsEnabled: true,
      reducedMotion: false,
      textOnlyMaps: true,
      updatedAt: now(),
    };
    preferencesStore.set(userId, prefs);
    return prefs;
  }

  saveLearningPreferences(
    userId: string,
    patch: Partial<LearningPreferences>,
  ): LearningPreferences {
    const current = this.loadLearningPreferences(userId);
    const next = {
      ...current,
      ...patch,
      userId,
      updatedAt: now(),
    } satisfies LearningPreferences;
    preferencesStore.set(userId, next);
    return next;
  }

  selectLearningObjective(userId: string, objectiveId: string): LearningObjective {
    const objective = getObjectiveById(objectiveId);
    if (!objective) {
      throw new AccessIntelligenceError(
        "VALIDATION_ERROR",
        "Learning objective not found.",
        "Choose an objective from the Learning Lab catalogue.",
      );
    }
    selectedObjectivesStore.set(userId, objectiveId);
    const concept = objective.concepts[0];
    if (concept) {
      this.updateMastery(userId, concept, "introduced", [
        `Selected objective ${objective.title}`,
      ]);
    }
    return objective;
  }

  listObjectives(): LearningObjective[] {
    return LEARNING_OBJECTIVES;
  }

  listScenarios(): LearningScenario[] {
    return [
      ...listPublishedScenarios(),
      ...Array.from(authorDraftsStore.values()).filter((s) => !s.published),
    ];
  }

  getScenario(scenarioId: string): LearningScenario {
    const draft = authorDraftsStore.get(scenarioId);
    if (draft) return draft;
    const scenario = getScenarioById(scenarioId);
    if (!scenario) {
      throw new AccessIntelligenceError(
        "VALIDATION_ERROR",
        "Scenario not found.",
        "Open the Learning Lab scenario catalogue.",
      );
    }
    return scenario;
  }

  getScenarioEvidence(scenarioId: string, sessionId?: string) {
    const scenario = this.getScenario(scenarioId);
    if (sessionId) {
      const session = this.getSession(sessionId);
      const prefs = this.loadLearningPreferences(session.userId);
      if (
        prefs.requirePredictionBeforeEvidence &&
        !session.evidenceRevealed &&
        session.stage === "prediction" &&
        !session.predictionOptionId
      ) {
        throw new AccessIntelligenceError(
          "VALIDATION_ERROR",
          "Prediction is required before evidence reveal.",
          "Submit a prediction first, then investigate evidence.",
        );
      }
      if (!canRevealEvidence(session) && prefs.requirePredictionBeforeEvidence) {
        throw new AccessIntelligenceError(
          "VALIDATION_ERROR",
          "Evidence is not yet available for this stage.",
          "Complete the prediction step first.",
        );
      }
      session.evidenceRevealed = true;
      session.updatedAt = now();
      sessionsStore.set(session.id, session);
    }
    return scenario.evidenceIds.map((evidenceId) => {
      const item = LEARNING_EVIDENCE[evidenceId];
      return (
        item ?? {
          id: evidenceId,
          label: evidenceId,
          status: "unknown" as const,
          summary: "Evidence item not found in didactic catalogue.",
        }
      );
    });
  }

  startScenario(input: {
    userId: string;
    scenarioId: string;
    mode?: LearningMode;
  }): PracticeSession {
    const scenario = this.getScenario(input.scenarioId);
    if (!scenario.published && input.mode !== "facilitate") {
      // Author drafts can still be previewed by author tools; practice needs published
      if (!authorDraftsStore.has(scenario.id)) {
        throw new AccessIntelligenceError(
          "VALIDATION_ERROR",
          "Scenario is not published.",
          "Request content review before practice use.",
        );
      }
    }
    const session: PracticeSession = {
      id: id("learn"),
      userId: input.userId,
      scenarioId: scenario.id,
      mode: input.mode ?? "practice",
      stage: "orientation",
      hintLevel: 0,
      predictionOptionId: null,
      decisionOptionId: null,
      revisionOptionId: null,
      confidencePrediction: null,
      evidenceRevealed: false,
      eventTriggered: false,
      teachBackText: null,
      reflections: [],
      transferComplete: false,
      responses: [],
      rubricEvaluation: null,
      createdAt: now(),
      updatedAt: now(),
    };
    sessionsStore.set(session.id, session);
    return session;
  }

  getSession(sessionId: string): PracticeSession {
    const session = sessionsStore.get(sessionId);
    if (!session) {
      throw new AccessIntelligenceError(
        "VALIDATION_ERROR",
        "Learning session not found.",
        "Start the scenario again.",
      );
    }
    return session;
  }

  advanceStage(sessionId: string, to?: LearningStage): PracticeSession {
    const session = this.getSession(sessionId);
    const target = to ?? nextStage(session.stage);
    assertValidTransition(session.stage, target);
    session.stage = target;
    session.updatedAt = now();
    sessionsStore.set(session.id, session);
    return session;
  }

  submitPrediction(
    sessionId: string,
    optionId: string,
    confidencePrediction?: number,
  ): PracticeSession {
    const session = this.getSession(sessionId);
    if (session.stage !== "prediction" && session.stage !== "orientation") {
      // Allow prediction capture once we have moved into prediction
      if (stageBefore(session.stage, "investigation")) {
        // ok
      }
    }
    if (session.stage === "orientation") {
      assertValidTransition("orientation", "prediction");
      session.stage = "prediction";
    }
    if (session.stage !== "prediction") {
      throw new AccessIntelligenceError(
        "VALIDATION_ERROR",
        "Predictions are only accepted during the prediction stage.",
        "Follow the scenario step order.",
      );
    }
    session.predictionOptionId = optionId;
    if (typeof confidencePrediction === "number") {
      session.confidencePrediction = confidencePrediction;
    }
    session.responses.push({
      id: id("resp"),
      sessionId,
      stage: "prediction",
      kind: "prediction",
      payload: { optionId, confidencePrediction },
      createdAt: now(),
    });
    session.updatedAt = now();
    sessionsStore.set(session.id, session);
    return session;
  }

  revealHint(sessionId: string): { level: number; text: string; session: PracticeSession } {
    const session = this.getSession(sessionId);
    const prefs = this.loadLearningPreferences(session.userId);
    if (!prefs.hintsEnabled) {
      throw new AccessIntelligenceError(
        "VALIDATION_ERROR",
        "Hints are disabled in your learning preferences.",
        "Enable hints in Learning Lab preferences.",
      );
    }
    const nextLevel = Math.min(3, session.hintLevel + 1) as 1 | 2 | 3;
    session.hintLevel = nextLevel;
    session.responses.push({
      id: id("resp"),
      sessionId,
      stage: session.stage,
      kind: "hint_request",
      payload: { level: nextLevel },
      createdAt: now(),
    });
    session.updatedAt = now();
    sessionsStore.set(session.id, session);
    return { ...getHint(nextLevel), session };
  }

  submitAccessDecision(sessionId: string, optionId: string): {
    session: PracticeSession;
    evaluation: RubricEvaluation;
  } {
    const session = this.getSession(sessionId);
    const scenario = this.getScenario(session.scenarioId);
    const decisionPoint = scenario.decisionPoints[0];
    if (!decisionPoint) {
      throw new AccessIntelligenceError(
        "VALIDATION_ERROR",
        "Scenario has no decision point.",
        "Choose another scenario.",
      );
    }
    if (session.stage === "investigation") {
      assertValidTransition("investigation", "decision");
      session.stage = "decision";
    }
    if (session.stage === "decision") {
      session.decisionOptionId = optionId;
      session.responses.push({
        id: id("resp"),
        sessionId,
        stage: "decision",
        kind: "decision",
        payload: { optionId },
        createdAt: now(),
      });
      assertValidTransition("decision", "consequence");
      session.stage = "consequence";
    } else if (session.stage === "revision") {
      session.revisionOptionId = optionId;
      session.responses.push({
        id: id("resp"),
        sessionId,
        stage: "revision",
        kind: "revision",
        payload: { optionId },
        createdAt: now(),
      });
    } else {
      throw new AccessIntelligenceError(
        "VALIDATION_ERROR",
        "Access decisions are accepted at decision or revision stages.",
        "Advance to the decision step first.",
      );
    }
    const evaluation = evaluateDecisionAgainstRubric({
      scenario,
      session,
      decisionPoint,
    });
    session.rubricEvaluation = evaluation;
    session.updatedAt = now();
    sessionsStore.set(session.id, session);
    return { session, evaluation };
  }

  simulateDynamicEvent(sessionId: string) {
    const session = this.getSession(sessionId);
    const scenario = this.getScenario(session.scenarioId);
    const event = scenario.dynamicEvents.find(
      (e) =>
        e.triggerAfterStage === "decision" ||
        e.triggerAfterStage === session.stage,
    );
    if (!event) {
      return { triggered: false as const, session, event: null };
    }
    session.eventTriggered = true;
    session.updatedAt = now();
    sessionsStore.set(session.id, session);
    return { triggered: true as const, session, event };
  }

  evaluateDecision(sessionId: string): RubricEvaluation {
    const session = this.getSession(sessionId);
    const scenario = this.getScenario(session.scenarioId);
    const decisionPoint = scenario.decisionPoints[0]!;
    return evaluateDecisionAgainstRubric({ scenario, session, decisionPoint });
  }

  requestTeachBack(sessionId: string) {
    const session = this.getSession(sessionId);
    const scenario = this.getScenario(session.scenarioId);
    if (session.stage === "consequence" || session.stage === "revision") {
      const target =
        session.stage === "consequence" ? "revision" : "teach_back";
      if (session.stage === "consequence") {
        assertValidTransition("consequence", "revision");
        session.stage = "revision";
      }
      if (target === "teach_back" || session.stage === "revision") {
        // From revision, caller may advance separately; expose prompt now
      }
    }
    if (session.stage !== "teach_back") {
      // Move through to teach_back if on revision
      if (session.stage === "revision") {
        assertValidTransition("revision", "teach_back");
        session.stage = "teach_back";
      }
    }
    session.updatedAt = now();
    sessionsStore.set(session.id, session);
    return {
      session,
      prompt: scenario.teachBackPrompt,
      governanceNote:
        "Teach-back checks understanding only. It does not award formal professional competence.",
    };
  }

  evaluateTeachBack(sessionId: string, text: string) {
    const session = this.getSession(sessionId);
    const scenario = this.getScenario(session.scenarioId);
    if (session.stage !== "teach_back") {
      throw new AccessIntelligenceError(
        "VALIDATION_ERROR",
        "Teach-back is only accepted during the teach_back stage.",
        "Advance to teach-back first.",
      );
    }
    session.teachBackText = text;
    session.responses.push({
      id: id("resp"),
      sessionId,
      stage: "teach_back",
      kind: "teach_back",
      payload: { text },
      createdAt: now(),
    });
    const result = evaluateTeachBackText(text, scenario.teachBackKeywords);
    // Boundary: never claim professional competence
    const feedback = [
      ...result.feedback,
      "This check is formative only and does not certify professional competence.",
    ];
    session.updatedAt = now();
    sessionsStore.set(session.id, session);
    return { ...result, feedback, session };
  }

  recordReflection(sessionId: string, reflections: string[]): PracticeSession {
    const session = this.getSession(sessionId);
    if (session.stage === "teach_back") {
      assertValidTransition("teach_back", "reflection");
      session.stage = "reflection";
    }
    if (session.stage !== "reflection") {
      throw new AccessIntelligenceError(
        "VALIDATION_ERROR",
        "Reflections are accepted during the reflection stage.",
        "Advance to reflection first.",
      );
    }
    session.reflections = reflections;
    session.responses.push({
      id: id("resp"),
      sessionId,
      stage: "reflection",
      kind: "reflection",
      payload: { reflections },
      createdAt: now(),
    });
    session.updatedAt = now();
    sessionsStore.set(session.id, session);
    return session;
  }

  completeTransfer(sessionId: string, response: string): PracticeSession {
    const session = this.getSession(sessionId);
    if (session.stage === "reflection") {
      assertValidTransition("reflection", "transfer");
      session.stage = "transfer";
    }
    if (session.stage !== "transfer") {
      throw new AccessIntelligenceError(
        "VALIDATION_ERROR",
        "Transfer tasks are accepted during the transfer stage.",
        "Advance to transfer first.",
      );
    }
    session.transferComplete = response.trim().length >= 20;
    session.responses.push({
      id: id("resp"),
      sessionId,
      stage: "transfer",
      kind: "transfer",
      payload: { response },
      createdAt: now(),
    });
    assertValidTransition("transfer", "complete");
    session.stage = "complete";
    session.updatedAt = now();
    sessionsStore.set(session.id, session);

    const scenario = this.getScenario(session.scenarioId);
    const evaluation =
      session.rubricEvaluation ??
      evaluateDecisionAgainstRubric({
        scenario,
        session,
        decisionPoint: scenario.decisionPoints[0]!,
      });
    const teachBack = evaluateTeachBackText(
      session.teachBackText ?? "",
      scenario.teachBackKeywords,
    );
    for (const objectiveId of scenario.objectiveIds) {
      const objective = getObjectiveById(objectiveId);
      for (const concept of objective?.concepts ?? []) {
        const current = this.getMastery(session.userId, concept);
        const next = nextMasteryLevel(current.level, evaluation, teachBack.passed);
        this.updateMastery(session.userId, concept, next, [
          `Completed scenario ${scenario.id}`,
        ]);
      }
    }
    return session;
  }

  getMastery(userId: string, conceptId: string): MasteryRecord {
    const key = masteryKey(userId, conceptId);
    const existing = masteryStore.get(key);
    if (existing) return existing;
    const record: MasteryRecord = {
      userId,
      conceptId,
      level: "introduced",
      evidenceNotes: [],
      updatedAt: now(),
    };
    masteryStore.set(key, record);
    return record;
  }

  listMastery(userId: string): MasteryRecord[] {
    return Array.from(masteryStore.values()).filter((m) => m.userId === userId);
  }

  updateMastery(
    userId: string,
    conceptId: string,
    level: MasteryRecord["level"],
    notes: string[] = [],
  ): MasteryRecord {
    const current = this.getMastery(userId, conceptId);
    const record: MasteryRecord = {
      ...current,
      level,
      evidenceNotes: [...current.evidenceNotes, ...notes].slice(-20),
      updatedAt: now(),
    };
    masteryStore.set(masteryKey(userId, conceptId), record);
    return record;
  }

  scheduleReview(input: {
    scenarioId: string;
    reviewType: ContentReview["reviewType"];
    reviewerName: string;
    notes?: string;
  }): ContentReview {
    const review: ContentReview = {
      id: id("review"),
      scenarioId: input.scenarioId,
      reviewType: input.reviewType,
      reviewerName: input.reviewerName,
      status: "requested",
      notes: input.notes,
    };
    contentReviewsStore.set(review.id, review);
    return review;
  }

  listContentReviews(scenarioId?: string): ContentReview[] {
    const all = Array.from(contentReviewsStore.values());
    return scenarioId ? all.filter((r) => r.scenarioId === scenarioId) : all;
  }

  approveContentReview(reviewId: string): ContentReview {
    const review = contentReviewsStore.get(reviewId);
    if (!review) {
      throw new AccessIntelligenceError(
        "VALIDATION_ERROR",
        "Content review not found.",
        "Schedule a review from the author studio first.",
      );
    }
    const next: ContentReview = {
      ...review,
      status: "approved",
      reviewedAt: now(),
    };
    contentReviewsStore.set(reviewId, next);
    return next;
  }

  createFieldMission(input: {
    userId: string;
    title: string;
    instructions: string;
    relatedScenarioId?: string;
    dueAt?: string;
  }): FieldMission {
    const mission: FieldMission = {
      id: id("mission"),
      userId: input.userId,
      title: input.title,
      instructions: input.instructions,
      relatedScenarioId: input.relatedScenarioId,
      dueAt: input.dueAt,
      status: "scheduled",
      createdAt: now(),
    };
    fieldMissionsStore.set(mission.id, mission);
    return mission;
  }

  listFieldMissions(userId: string): FieldMission[] {
    return Array.from(fieldMissionsStore.values()).filter(
      (m) => m.userId === userId,
    );
  }

  saveAuthorDraft(scenario: LearningScenario): LearningScenario {
    // Generated / draft content cannot silently publish
    const draft: LearningScenario = {
      ...scenario,
      published: false,
    };
    authorDraftsStore.set(draft.id, draft);
    return draft;
  }

  requestPublish(scenarioId: string): {
    allowed: boolean;
    reason: string;
    scenario?: LearningScenario;
  } {
    const scenario = this.getScenario(scenarioId);
    const reviews = this.listContentReviews(scenarioId);
    const hasA11y = reviews.some(
      (r) => r.reviewType === "accessibility" && r.status === "approved",
    );
    const hasLived = reviews.some(
      (r) => r.reviewType === "lived_experience" && r.status === "approved",
    );
    if (!hasA11y || !hasLived) {
      return {
        allowed: false,
        reason:
          "Published scenarios require approved accessibility and lived-experience review. Generated content must not publish without review.",
      };
    }
    const published: LearningScenario = {
      ...scenario,
      published: true,
      accessibilityReviewer:
        scenario.accessibilityReviewer ??
        reviews.find((r) => r.reviewType === "accessibility")?.reviewerName,
      livedExperienceReviewer:
        scenario.livedExperienceReviewer ??
        reviews.find((r) => r.reviewType === "lived_experience")?.reviewerName,
      reviewDate: now().slice(0, 10),
    };
    authorDraftsStore.set(published.id, published);
    return { allowed: true, reason: "Publish gates satisfied.", scenario: published };
  }

  createFacilitatedSession(input: {
    facilitatorUserId: string;
    scenarioId: string;
    participantIds?: string[];
    anonymousResponses?: boolean;
  }): FacilitatedSession {
    this.getScenario(input.scenarioId);
    const session: FacilitatedSession = {
      id: id("facil"),
      facilitatorUserId: input.facilitatorUserId,
      scenarioId: input.scenarioId,
      mode: "facilitate",
      participantIds: input.participantIds ?? [],
      anonymousResponses: input.anonymousResponses ?? true,
      pausedAtStage: "orientation",
      revealedStageIds: ["st-orientation"],
      responses: [],
      createdAt: now(),
      updatedAt: now(),
    };
    facilitateStore.set(session.id, session);
    return session;
  }

  getFacilitatedSession(sessionId: string): FacilitatedSession {
    const session = facilitateStore.get(sessionId);
    if (!session) {
      throw new AccessIntelligenceError(
        "VALIDATION_ERROR",
        "Facilitated session not found.",
        "Create a new facilitation session from Author or Facilitator tools.",
      );
    }
    return session;
  }

  pauseFacilitatedSession(
    sessionId: string,
    stage: LearningStage,
  ): FacilitatedSession {
    const session = this.getFacilitatedSession(sessionId);
    session.pausedAtStage = stage;
    session.updatedAt = now();
    facilitateStore.set(session.id, session);
    return session;
  }

  revealFacilitatedStage(
    sessionId: string,
    stageId: string,
  ): FacilitatedSession {
    const session = this.getFacilitatedSession(sessionId);
    if (!session.revealedStageIds.includes(stageId)) {
      session.revealedStageIds = [...session.revealedStageIds, stageId];
    }
    session.updatedAt = now();
    facilitateStore.set(session.id, session);
    return session;
  }

  addFacilitatedResponse(
    sessionId: string,
    response: FacilitatedSession["responses"][number],
  ): FacilitatedSession {
    const session = this.getFacilitatedSession(sessionId);
    const scrubbed = session.anonymousResponses
      ? {
          ...response,
          payload: { ...response.payload, respondentLabel: "anonymous" },
        }
      : response;
    session.responses = [...session.responses, scrubbed];
    session.updatedAt = now();
    facilitateStore.set(session.id, session);
    return session;
  }

  exportFacilitatedSummary(sessionId: string) {
    const session = this.getFacilitatedSession(sessionId);
    const scenario = this.getScenario(session.scenarioId);
    return {
      sessionId: session.id,
      scenarioTitle: scenario.title,
      pausedAtStage: session.pausedAtStage,
      revealedStageIds: session.revealedStageIds,
      responseCount: session.responses.length,
      anonymous: session.anonymousResponses,
      debriefNotes: session.debriefNotes ?? "",
      completionSummary: `${session.responses.length} responses collected for “${scenario.title}”. No public leaderboard is produced.`,
      accessibleExport: [
        `Scenario: ${scenario.title}`,
        `Goal: ${scenario.humanGoal}`,
        `Paused at: ${session.pausedAtStage ?? "n/a"}`,
        `Responses: ${session.responses.length} (${session.anonymousResponses ? "anonymous" : "named"})`,
        `Debrief: ${session.debriefNotes ?? "(none)"}`,
      ].join("\n"),
    };
  }
}

function stageBefore(stage: LearningStage, other: LearningStage): boolean {
  const order = [
    "orientation",
    "prediction",
    "investigation",
    "decision",
    "consequence",
    "revision",
    "teach_back",
    "reflection",
    "transfer",
    "complete",
  ] as const;
  return order.indexOf(stage) < order.indexOf(other);
}

let singleton: LearningRepository | null = null;

export function getLearningRepository(): LearningRepository {
  if (!singleton) singleton = new LearningRepository();
  return singleton;
}

/** Test helper to reset in-memory stores between cases. */
export function resetLearningRepositoryForTests(): void {
  preferencesStore.clear();
  sessionsStore.clear();
  masteryStore.clear();
  facilitateStore.clear();
  fieldMissionsStore.clear();
  contentReviewsStore.clear();
  authorDraftsStore.clear();
  selectedObjectivesStore.clear();
  singleton = new LearningRepository();
}
