import { generateObject } from "ai";
import { z } from "zod";

import { caseManagementConfig } from "@/lib/config/case-management";
import { phase5Config } from "@/lib/config/phase5";
import { createAgentRun } from "@/lib/agent-ops/agent-run-service";
import { getInterpreterModel } from "@/lib/search/interpreter/get-model";
import { isSearchInterpreterConfigured } from "@/lib/config/search-interpreter";

import { nextActions } from "./next-actions";
import { searchCases } from "./nl-search";
import { classifyRisk } from "./risk-classifier";
import { summarise } from "./summary-generator";
import type {
  AINextAction,
  AIRiskAssessment,
  AISearchHit,
  AISummary,
  CaseAIEngine,
  CaseSnapshot,
} from "./types";

const riskSchema = z.object({
  level: z.enum(["low", "medium", "high", "critical"]),
  rationale: z.string(),
  signals: z.array(z.string()).max(5),
});

const summarySchema = z.object({
  text: z.string(),
  highlights: z.array(z.string()).max(5),
});

/**
 * LLM-backed case AI engine. Falls back to rules engine when AI is not configured.
 * All outputs require human review (maxConfidence capped at 0.65).
 */
export class LLMCaseAIEngine implements CaseAIEngine {
  readonly id = process.env.CASE_MANAGEMENT_AI_ENGINE_ID ?? "llm-v1";
  readonly maxConfidence = 0.65;

  private rulesFallback = {
    classifyRisk,
    summarise,
    nextActions,
    search: searchCases,
  };

  classifyRisk(input: CaseSnapshot): AIRiskAssessment {
    if (!this.canUseLlm()) {
      return this.rulesFallback.classifyRisk(input);
    }
    return this.rulesFallback.classifyRisk(input);
  }

  summarise(input: CaseSnapshot): AISummary {
    if (!this.canUseLlm()) {
      return this.rulesFallback.summarise(input);
    }
    return this.rulesFallback.summarise(input);
  }

  nextActions(input: CaseSnapshot): AINextAction[] {
    return this.rulesFallback.nextActions(input);
  }

  search(query: string, candidates: CaseSnapshot[]): AISearchHit[] {
    return this.rulesFallback.search(query, candidates);
  }

  async classifyRiskAsync(
    input: CaseSnapshot,
    actorUserId?: string
  ): Promise<AIRiskAssessment> {
    if (!this.canUseLlm()) {
      return this.rulesFallback.classifyRisk(input);
    }

    try {
      const { object } = await generateObject({
        model: getInterpreterModel(),
        schema: riskSchema,
        system: `You assess case risk for Australian disability support cases.
Return conservative risk levels. Never auto-escalate — humans decide.`,
        prompt: JSON.stringify({
          reference: input.reference,
          title: input.title,
          description: input.description.slice(0, 2000),
          status: input.status,
          priority: input.priority,
          noteCount: input.notes.length,
        }),
        temperature: 0.1,
      });

      const result: AIRiskAssessment = {
        level: object.level,
        score: object.level === "critical" ? 0.9 : object.level === "high" ? 0.75 : 0.5,
        signals: object.signals,
        rationale: object.rationale,
      };

      await createAgentRun({
        agentType: "case_ai",
        inputSummary: { caseId: input.id, kind: "risk" },
        outputSummary: result as unknown as Record<string, unknown>,
        humanReviewRequired: true,
        riskTier: object.level === "high" || object.level === "critical" ? "high" : "medium",
        actorUserId,
      });

      return result;
    } catch {
      return this.rulesFallback.classifyRisk(input);
    }
  }

  async summariseAsync(
    input: CaseSnapshot,
    actorUserId?: string
  ): Promise<AISummary> {
    if (!this.canUseLlm()) {
      return this.rulesFallback.summarise(input);
    }

    try {
      const { object } = await generateObject({
        model: getInterpreterModel(),
        schema: summarySchema,
        system: `Summarise disability support cases for coordinators.
Use plain Australian English. Flag items needing human follow-up.`,
        prompt: JSON.stringify({
          reference: input.reference,
          title: input.title,
          description: input.description.slice(0, 2000),
          tasks: input.tasks.map((t) => t.title),
        }),
        temperature: 0.2,
      });

      await createAgentRun({
        agentType: "case_ai",
        inputSummary: { caseId: input.id, kind: "summary" },
        outputSummary: object as unknown as Record<string, unknown>,
        humanReviewRequired: true,
        actorUserId,
      });

      return object;
    } catch {
      return this.rulesFallback.summarise(input);
    }
  }

  private canUseLlm() {
    return (
      caseManagementConfig.aiEnabled &&
      phase5Config.fairnessChecksEnabled &&
      isSearchInterpreterConfigured()
    );
  }
}

export function createLLMCaseAIEngine() {
  return new LLMCaseAIEngine();
}
