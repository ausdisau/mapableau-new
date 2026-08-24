/**
 * Nerve Centre Evaluation Lab — synthetic simulation only.
 * Fail-closed: never enables production writes or live participant data.
 */

function envFlag(name: string, defaultEnabled = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultEnabled;
  return raw === "true";
}

export const NERVE_CENTRE_EVAL_LAB_FLAG =
  "MAPABLE_NERVE_CENTRE_EVAL_LAB_ENABLED";

export const NERVE_CENTRE_EVAL_LAB_MODEL_FLAG =
  "MAPABLE_NERVE_CENTRE_EVAL_LAB_MODEL_EVALS_ENABLED";

export const nerveCentreEvalLabConfig = {
  get enabled(): boolean {
    return envFlag(NERVE_CENTRE_EVAL_LAB_FLAG, false);
  },
  get modelEvalsEnabled(): boolean {
    return this.enabled && envFlag(NERVE_CENTRE_EVAL_LAB_MODEL_FLAG, false);
  },
  get productionWritesAllowed(): false {
    return false;
  },
  get realParticipantDataAllowed(): false {
    return false;
  },
};

export function isNerveCentreEvalLabEnabled(): boolean {
  return nerveCentreEvalLabConfig.enabled;
}
