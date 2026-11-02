function enabled(name: string) {
  return process.env[name] === "true";
}

/**
 * Adtunis communication layer flags. Fail closed unless explicitly enabled.
 */
export const adtunisConfig = {
  enabled: enabled("MAPABLE_ADTUNIS_ENABLED"),
  messagingMode:
    process.env.ADTUNIS_MESSAGING_MODE === "live" ? "live" : "mock",
  simulatedAsr: enabled("ADTUNIS_SIMULATED_ASR"),
} as const;

export function ensureAdtunisEnabled() {
  if (!adtunisConfig.enabled) {
    throw new Error("ADTUNIS_DISABLED");
  }
}
