export const NDIA_CAPABILITIES = [
  "products.read",
  "plan.determine",
  "plan.read",
  "budget.read",
  "payments.submit",
  "payments.status.read",
] as const;

export type NdiaCapability = (typeof NDIA_CAPABILITIES)[number];

export const NDIA_DENIAL_CODE = "NOT_AUTHORISED_OR_NOT_CONFIGURED" as const;

export type NdiaCapabilityResult = {
  capability: NdiaCapability;
  authorised: false;
  code: typeof NDIA_DENIAL_CODE;
  message: string;
};

/**
 * Disabled, typed NDIA readiness contract.
 * All protected operations return NOT_AUTHORISED_OR_NOT_CONFIGURED.
 * Never invents endpoints or credentials.
 */
export function invokeNdiaCapability(
  capability: NdiaCapability,
): NdiaCapabilityResult {
  return {
    capability,
    authorised: false,
    code: NDIA_DENIAL_CODE,
    message: `NDIA capability '${capability}' is not authorised or not configured for Coverage Care. Live submission remains impossible.`,
  };
}

export function listNdiaCapabilityDenials(): NdiaCapabilityResult[] {
  return NDIA_CAPABILITIES.map((capability) => invokeNdiaCapability(capability));
}
