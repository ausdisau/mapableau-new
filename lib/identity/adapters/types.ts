/**
 * Shared adapter contracts for MapAbleID authentication integrations.
 * Implementations must remain server-side. Biometric prompts alone are not
 * evidence of a verified authentication event.
 */

export type AdapterCapabilityStatus =
  | "active"
  | "disabled"
  | "not_configured"
  | "blocked";

export type IdentityAdapterDescriptor = Readonly<{
  id: string;
  label: string;
  status: AdapterCapabilityStatus;
  reason?: string;
}>;

export type VerifiedAuthSubject = Readonly<{
  subjectId: string;
  issuer: string;
  audience: string;
  sessionId: string;
  expiresAtMs: number;
}>;
