/** Direct Xero draft ACCREC export — default OFF. */
export function isXeroDirectEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.XERO_DIRECT_ENABLED === "true";
}
