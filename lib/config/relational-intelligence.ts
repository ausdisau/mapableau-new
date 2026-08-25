/**
 * Relational Intelligence feature flags (Prompt 01).
 * All default OFF. Enable only with explicit env value `"true"`.
 */

function envFlag(name: string): boolean {
  return process.env[name] === "true";
}

export const RELATIONAL_INTELLIGENCE_FLAGS = {
  enabled: "MAPABLE_RELATIONAL_INTELLIGENCE_ENABLED",
  modelAssisted: "MAPABLE_RELATIONAL_INTELLIGENCE_MODEL_ASSISTED",
  draft: "MAPABLE_RELATIONAL_INTELLIGENCE_DRAFT",
  accessSearch: "MAPABLE_RELATIONAL_INTELLIGENCE_ACCESS_SEARCH",
  humanHelp: "MAPABLE_RELATIONAL_INTELLIGENCE_HUMAN_HELP",
  killSwitch: "MAPABLE_RELATIONAL_INTELLIGENCE_KILL_SWITCH",
} as const;

export type RelationalIntelligenceFlagKey =
  (typeof RELATIONAL_INTELLIGENCE_FLAGS)[keyof typeof RELATIONAL_INTELLIGENCE_FLAGS];

export const relationalIntelligenceConfig = {
  get enabled() {
    return envFlag(RELATIONAL_INTELLIGENCE_FLAGS.enabled);
  },
  get modelAssisted() {
    return envFlag(RELATIONAL_INTELLIGENCE_FLAGS.modelAssisted);
  },
  get draft() {
    return envFlag(RELATIONAL_INTELLIGENCE_FLAGS.draft);
  },
  get accessSearch() {
    return envFlag(RELATIONAL_INTELLIGENCE_FLAGS.accessSearch);
  },
  get humanHelp() {
    return envFlag(RELATIONAL_INTELLIGENCE_FLAGS.humanHelp);
  },
  /** When true, all Relational Intelligence capabilities are denied. */
  get killSwitch() {
    return envFlag(RELATIONAL_INTELLIGENCE_FLAGS.killSwitch);
  },
};

export function isRelationalFeatureFlagEnabled(
  flag: string | null | undefined,
): boolean {
  if (!flag) return true;
  switch (flag) {
    case RELATIONAL_INTELLIGENCE_FLAGS.enabled:
      return relationalIntelligenceConfig.enabled;
    case RELATIONAL_INTELLIGENCE_FLAGS.modelAssisted:
      return relationalIntelligenceConfig.modelAssisted;
    case RELATIONAL_INTELLIGENCE_FLAGS.draft:
      return relationalIntelligenceConfig.draft;
    case RELATIONAL_INTELLIGENCE_FLAGS.accessSearch:
      return relationalIntelligenceConfig.accessSearch;
    case RELATIONAL_INTELLIGENCE_FLAGS.humanHelp:
      return relationalIntelligenceConfig.humanHelp;
    case RELATIONAL_INTELLIGENCE_FLAGS.killSwitch:
      return relationalIntelligenceConfig.killSwitch;
    default:
      return false;
  }
}

export function isRelationalIntelligenceKilled(): boolean {
  return relationalIntelligenceConfig.killSwitch;
}
