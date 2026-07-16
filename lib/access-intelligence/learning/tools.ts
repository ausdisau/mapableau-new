import { tool } from "ai";
import { z } from "zod";

import type { ServerAccessContext } from "../types";

import { getLearningRepository } from "./repository";
import { learningModeSchema, learningStageSchema } from "./schemas";

/**
 * Learning Lab tools for the Access Intelligence agent.
 * The model may narrate, hint, and adapt presentation — but must not override
 * deterministic access decisions, route eligibility, or invent facts from unknowns.
 */
export function createLearningTools(ctx: ServerAccessContext) {
  const repo = getLearningRepository();

  return {
    loadLearningPreferences: tool({
      description:
        "Load didactic Learning Lab preferences. Does not change access decisions.",
      inputSchema: z.object({}),
      execute: async () => repo.loadLearningPreferences(ctx.userId),
    }),

    selectLearningObjective: tool({
      description: "Select a learning objective / concept focus for practice.",
      inputSchema: z.object({
        objectiveId: z.string(),
      }),
      execute: async ({ objectiveId }) =>
        repo.selectLearningObjective(ctx.userId, objectiveId),
    }),

    startScenario: tool({
      description:
        "Start a Learning Lab scenario session (practice / guide_me). Does not block Plan mode.",
      inputSchema: z.object({
        scenarioId: z.string(),
        mode: learningModeSchema.optional(),
      }),
      execute: async ({ scenarioId, mode }) =>
        repo.startScenario({
          userId: ctx.userId,
          scenarioId,
          mode: mode === "plan" ? "practice" : mode,
        }),
    }),

    getScenarioEvidence: tool({
      description:
        "Reveal didactic scenario evidence. Respects prediction-before-evidence preferences. Never upgrades unknown to fact.",
      inputSchema: z.object({
        scenarioId: z.string(),
        sessionId: z.string().optional(),
      }),
      execute: async ({ scenarioId, sessionId }) =>
        repo.getScenarioEvidence(scenarioId, sessionId),
    }),

    submitPrediction: tool({
      description: "Record the learner prediction before investigation.",
      inputSchema: z.object({
        sessionId: z.string(),
        optionId: z.string(),
        confidencePrediction: z.number().min(0).max(100).optional(),
      }),
      execute: async ({ sessionId, optionId, confidencePrediction }) =>
        repo.submitPrediction(sessionId, optionId, confidencePrediction),
    }),

    revealHint: tool({
      description:
        "Reveal the next graduated hint (prompt → point to evidence → explanation).",
      inputSchema: z.object({
        sessionId: z.string(),
      }),
      execute: async ({ sessionId }) => repo.revealHint(sessionId),
    }),

    submitAccessDecision: tool({
      description:
        "Submit a didactic decision option. Rubric evaluation is deterministic. Does not change production access engines.",
      inputSchema: z.object({
        sessionId: z.string(),
        optionId: z.string(),
      }),
      execute: async ({ sessionId, optionId }) =>
        repo.submitAccessDecision(sessionId, optionId),
    }),

    simulateDynamicEvent: tool({
      description: "Introduce a scenario dynamic incident after a decision point.",
      inputSchema: z.object({
        sessionId: z.string(),
      }),
      execute: async ({ sessionId }) => repo.simulateDynamicEvent(sessionId),
    }),

    evaluateDecisionAgainstRubric: tool({
      description: "Run deterministic rubric evaluation for the practice session.",
      inputSchema: z.object({
        sessionId: z.string(),
      }),
      execute: async ({ sessionId }) => repo.evaluateDecision(sessionId),
    }),

    requestTeachBack: tool({
      description:
        "Request teach-back. Formative only — does not award formal professional competence.",
      inputSchema: z.object({
        sessionId: z.string(),
      }),
      execute: async ({ sessionId }) => repo.requestTeachBack(sessionId),
    }),

    evaluateTeachBack: tool({
      description: "Evaluate teach-back text against keywords with governance boundaries.",
      inputSchema: z.object({
        sessionId: z.string(),
        text: z.string().min(1),
      }),
      execute: async ({ sessionId, text }) =>
        repo.evaluateTeachBack(sessionId, text),
    }),

    recordReflection: tool({
      description: "Store reflection responses for the practice session.",
      inputSchema: z.object({
        sessionId: z.string(),
        reflections: z.array(z.string()),
      }),
      execute: async ({ sessionId, reflections }) =>
        repo.recordReflection(sessionId, reflections),
    }),

    updateMastery: tool({
      description:
        "Update concept-level mastery (no public leaderboards). Levels: introduced → developing → independent → can_explain_to_others.",
      inputSchema: z.object({
        conceptId: z.string(),
        level: z.enum([
          "introduced",
          "developing",
          "independent",
          "can_explain_to_others",
        ]),
        notes: z.array(z.string()).optional(),
      }),
      execute: async ({ conceptId, level, notes }) =>
        repo.updateMastery(ctx.userId, conceptId, level, notes ?? []),
    }),

    scheduleReview: tool({
      description:
        "Request lived-experience / accessibility / professional review before publishing generated training content.",
      inputSchema: z.object({
        scenarioId: z.string(),
        reviewType: z.enum([
          "accessibility",
          "lived_experience",
          "professional",
          "editorial",
        ]),
        reviewerName: z.string(),
        notes: z.string().optional(),
      }),
      execute: async (input) => repo.scheduleReview(input),
    }),

    createFieldMission: tool({
      description: "Schedule a real-world transfer / field mission related to a scenario.",
      inputSchema: z.object({
        title: z.string(),
        instructions: z.string(),
        relatedScenarioId: z.string().optional(),
        dueAt: z.string().optional(),
      }),
      execute: async (input) =>
        repo.createFieldMission({ userId: ctx.userId, ...input }),
    }),

    advanceLearningStage: tool({
      description: "Advance the deterministic learning state machine by one valid step.",
      inputSchema: z.object({
        sessionId: z.string(),
        to: learningStageSchema.optional(),
      }),
      execute: async ({ sessionId, to }) => repo.advanceStage(sessionId, to),
    }),
  };
}
