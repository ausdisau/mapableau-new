/**
 * Deterministic quest prioritisation — evidence quality over engagement.
 */

import type { AccessQuest } from "./types";

export type QuestPriorityContext = {
  missingCriticalEvidence: boolean;
  staleEvidence: boolean;
  conflictingObservations: boolean;
  highUseLocation: boolean;
  journeyCritical: boolean;
  communityRequestedVerification: boolean;
};

export function scoreQuestPriority(
  quest: AccessQuest,
  ctx: QuestPriorityContext,
): number {
  let score = quest.priorityWeight;
  if (ctx.missingCriticalEvidence) score += 40;
  if (ctx.staleEvidence) score += 25;
  if (ctx.conflictingObservations) score += 30;
  if (ctx.highUseLocation) score += 15;
  if (ctx.journeyCritical) score += 35;
  if (ctx.communityRequestedVerification) score += 20;
  // No engagement / gamification boosts.
  return score;
}

export function prioritiseQuests(
  quests: AccessQuest[],
  ctxByQuestId: Record<string, QuestPriorityContext>,
): AccessQuest[] {
  return [...quests].sort((a, b) => {
    const sa = scoreQuestPriority(
      a,
      ctxByQuestId[a.id] ?? {
        missingCriticalEvidence: false,
        staleEvidence: false,
        conflictingObservations: false,
        highUseLocation: false,
        journeyCritical: false,
        communityRequestedVerification: false,
      },
    );
    const sb = scoreQuestPriority(
      b,
      ctxByQuestId[b.id] ?? {
        missingCriticalEvidence: false,
        staleEvidence: false,
        conflictingObservations: false,
        highUseLocation: false,
        journeyCritical: false,
        communityRequestedVerification: false,
      },
    );
    if (sb !== sa) return sb - sa;
    return a.id.localeCompare(b.id);
  });
}
