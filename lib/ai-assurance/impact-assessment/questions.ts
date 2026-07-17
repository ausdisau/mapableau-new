/**
 * Impact-assessment questionnaire (offline, non-DB). Every new AURA agent
 * manifest must answer these before production activation.
 */

export const IMPACT_ASSESSMENT_QUESTIONS = [
  "Who benefits from this agent, in plain language?",
  "Who could be harmed if the agent is wrong?",
  "What data does the agent read? What does it write?",
  "What actions can this agent take without a human confirming?",
  "How does the participant pause or stop the agent?",
  "How is decline (participant says 'no') recorded?",
  "How is a failure detected and what compensates it?",
  "What is the maximum financial impact per action and per envelope?",
  "Which specialist agents can hand off to this agent and vice-versa?",
  "What accessibility supports are built in?",
  "Does the agent claim to be a legal, medical, or financial adviser? (Must be 'no'.)",
] as const;

export interface ImpactAssessmentAnswer {
  question: string;
  answer: string;
}

export function isAssessmentComplete(
  answers: ImpactAssessmentAnswer[]
): boolean {
  if (answers.length < IMPACT_ASSESSMENT_QUESTIONS.length) return false;
  const map = new Map(answers.map((a) => [a.question, a.answer]));
  return IMPACT_ASSESSMENT_QUESTIONS.every(
    (q) => (map.get(q) ?? "").trim().length > 0
  );
}
