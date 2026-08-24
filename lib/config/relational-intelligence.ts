/**
 * MapAble Relational Intelligence pilot flags.
 * All flags default false (fail closed). Enable only with explicit `=== "true"`.
 */

function envFlag(name: string, defaultEnabled = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultEnabled;
  return raw === "true";
}

export const RELATIONAL_INTELLIGENCE_FLAG = "MAPABLE_RELATIONAL_INTELLIGENCE_ENABLED";

export const relationalIntelligenceConfig = {
  /** Master switch for relational.* capabilities. */
  get enabled(): boolean {
    return envFlag(RELATIONAL_INTELLIGENCE_FLAG, false);
  },
  /** Model-assisted interpret/clarify/explain when relational pilot is on. */
  get modelAssistedEnabled(): boolean {
    return (
      this.enabled &&
      envFlag("MAPABLE_RELATIONAL_INTELLIGENCE_MODEL_ASSISTED", false)
    );
  },
  /** Draft-only relational envelopes (never send/book/pay). */
  get draftEnabled(): boolean {
    return (
      this.enabled && envFlag("MAPABLE_RELATIONAL_INTELLIGENCE_DRAFT", false)
    );
  },
  /** access.search.read tool under Navigator matching. */
  get accessSearchEnabled(): boolean {
    return (
      this.enabled &&
      envFlag("MAPABLE_RELATIONAL_INTELLIGENCE_ACCESS_SEARCH", false)
    );
  },
  /** human.help.request escalation surface. */
  get humanHelpEnabled(): boolean {
    return (
      this.enabled &&
      envFlag("MAPABLE_RELATIONAL_INTELLIGENCE_HUMAN_HELP", false)
    );
  },
};

export function isRelationalIntelligenceEnabled(): boolean {
  return relationalIntelligenceConfig.enabled;
}
