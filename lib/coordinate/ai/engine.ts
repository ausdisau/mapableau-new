import { coordinateConfig } from "@/lib/config/coordinate";

import { draftCommunication } from "./communication-drafter";
import { extractGoalsFromSummary } from "./goal-extractor";
import { summarisePlanFromText } from "./plan-summariser";
import { rankProviders, type ProviderMatchInput } from "./provider-matcher";

export interface CoordinateAIEngine {
  readonly id: string;
  readonly maxConfidence: number;
  summarisePlan(planText: string): ReturnType<typeof summarisePlanFromText>;
  extractGoals(summary: {
    headline?: string;
    keyPoints?: string[];
  }): ReturnType<typeof extractGoalsFromSummary>;
  rankProviders(params: {
    providers: ProviderMatchInput[];
    needDescription: string;
    participantSuburb?: string | null;
  }): ReturnType<typeof rankProviders>;
  draftCommunication(params: {
    participantName: string;
    topic: string;
    channel: "email" | "sms" | "in_app";
  }): ReturnType<typeof draftCommunication>;
}

class RulesEngine implements CoordinateAIEngine {
  readonly id = coordinateConfig.aiEngineId;
  readonly maxConfidence = 0.7;

  summarisePlan(planText: string) {
    return summarisePlanFromText(planText);
  }

  extractGoals(summary: { headline?: string; keyPoints?: string[] }) {
    return extractGoalsFromSummary(summary);
  }

  rankProviders(params: {
    providers: ProviderMatchInput[];
    needDescription: string;
    participantSuburb?: string | null;
  }) {
    return rankProviders(params);
  }

  draftCommunication(params: {
    participantName: string;
    topic: string;
    channel: "email" | "sms" | "in_app";
  }) {
    return draftCommunication(params);
  }
}

let activeEngine: CoordinateAIEngine = new RulesEngine();

export function getCoordinateAIEngine(): CoordinateAIEngine {
  return activeEngine;
}

export function setCoordinateAIEngine(engine: CoordinateAIEngine): void {
  activeEngine = engine;
}

export function resetCoordinateAIEngine(): void {
  activeEngine = new RulesEngine();
}
