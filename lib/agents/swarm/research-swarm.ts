/**
 * Low-risk research/synthesis only — not for incidents, complaints, invoices,
 * clinical workflows, participant PII access, worker assignment, or payments.
 */
export const RESEARCH_SWARM_ALLOWED_TOPICS = [
  "policy_research",
  "provider_market_research",
  "accessibility_trends",
  "product_ideation",
  "internal_planning",
] as const;

export function assertResearchSwarmTopic(topic: string): void {
  const allowed = RESEARCH_SWARM_ALLOWED_TOPICS.some((t) => topic.includes(t));
  if (!allowed) {
    throw new Error(
      "Swarm is limited to low-risk internal research topics on MapAble."
    );
  }
}

export async function runResearchSwarmSummary(prompt: string): Promise<string> {
  assertResearchSwarmTopic(
    /policy|market|accessibility|ideation|planning/i.test(prompt)
      ? "policy_research"
      : "blocked"
  );
  return `[Research synthesis — draft only] Summary for: ${prompt.slice(0, 200)}. No participant data was accessed.`;
}
