/** Deputy direct adapter — default OFF. */
export function isDeputyEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  return env.DEPUTY_ENABLED === "true";
}
