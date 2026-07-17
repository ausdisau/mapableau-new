export type SloDefinition = {
  name: string;
  targetSuccessRatio: number;
  windowDays: number;
};

export function evaluateSlo(params: {
  definition: SloDefinition;
  successes: number;
  total: number;
}): { met: boolean; ratio: number } {
  if (params.total <= 0) {
    return { met: false, ratio: 0 };
  }
  const ratio = params.successes / params.total;
  return { met: ratio >= params.definition.targetSuccessRatio, ratio };
}

export const ASSURANCE_DEFAULT_SLOS: SloDefinition[] = [
  { name: "api_availability", targetSuccessRatio: 0.99, windowDays: 30 },
  { name: "job_success", targetSuccessRatio: 0.95, windowDays: 7 },
];
