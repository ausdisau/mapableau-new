export type RecoveryObjectives = {
  rpoHours: number;
  rtoHours: number;
};

export const DEFAULT_RECOVERY_OBJECTIVES: RecoveryObjectives = {
  rpoHours: 24,
  rtoHours: 72,
};

export function recoveryObjectivesMet(params: {
  actualRpoHours: number;
  actualRtoHours: number;
  objectives?: RecoveryObjectives;
}): boolean {
  const objectives = params.objectives ?? DEFAULT_RECOVERY_OBJECTIVES;
  return (
    params.actualRpoHours <= objectives.rpoHours &&
    params.actualRtoHours <= objectives.rtoHours
  );
}
