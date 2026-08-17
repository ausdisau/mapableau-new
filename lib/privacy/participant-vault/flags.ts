function envTruthy(key: string, environment: NodeJS.ProcessEnv = process.env): boolean {
  const v = environment[key];
  return v === "1" || v === "true" || v === "yes";
}

/**
 * Participants Information Vault. Default OFF.
 * Uploads additionally require the document ObjectStore triple gate.
 */
export function isParticipantInformationVaultEnabled(
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  return envTruthy("MAPABLE_PARTICIPANT_INFORMATION_VAULT_ENABLED", environment);
}
