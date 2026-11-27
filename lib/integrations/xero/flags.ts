/** Direct Xero draft ACCREC export — default OFF. */
export function isXeroDirectEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  return env.XERO_DIRECT_ENABLED === "true";
}
