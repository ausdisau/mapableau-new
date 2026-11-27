/** Deputy direct adapter — default OFF. */
export function isDeputyEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.DEPUTY_ENABLED === "true";
}
