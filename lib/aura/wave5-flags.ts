/** Wave 5 Memory + Calibration flags (independent of deferred Agent OS waves). */

function envTrue(name: string): boolean {
  const v = process.env[name];
  return v === "true" || v === "1";
}

export function wave5MemoryEnabled(): boolean {
  return envTrue("MAPABLE_AURA_MEMORY_ENABLED");
}

export function wave5MemorySuggestionsEnabled(): boolean {
  return wave5MemoryEnabled() && envTrue("MAPABLE_AURA_MEMORY_SUGGESTIONS_ENABLED");
}

export function wave5OutcomeCalibrationEnabled(): boolean {
  return envTrue("MAPABLE_AURA_OUTCOME_CALIBRATION_ENABLED");
}

export function wave5EvidenceCorrectionsEnabled(): boolean {
  return (
    wave5OutcomeCalibrationEnabled() &&
    envTrue("MAPABLE_AURA_EVIDENCE_CORRECTIONS_ENABLED")
  );
}
