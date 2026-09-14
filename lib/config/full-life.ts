function envFlag(name: string, defaultEnabled = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultEnabled;
  return raw === "true";
}

export const fullLifeHarnessConfig = {
  get enabled(): boolean {
    return envFlag("MAPABLE_FULL_LIFE_HARNESS_ENABLED", false);
  },
  get shadowOnly(): boolean {
    return envFlag("MAPABLE_FULL_LIFE_HARNESS_SHADOW_ONLY", true);
  },
  get mayInfluenceRuntime(): boolean {
    return this.enabled && !this.shadowOnly;
  },
};
