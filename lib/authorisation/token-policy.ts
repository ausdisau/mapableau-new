import { parseConsentBoundToken } from "./consent-bound-tokens";

/**
 * Policy checks that reject a consent-bound token before it is dereferenced.
 * Fail-closed: unknown, expired, or malformed tokens return `denied`.
 */

export type TokenPolicyVerdict =
  | { verdict: "allow"; directiveId: string; entityKey: string | null }
  | { verdict: "deny"; reason: string };

export function evaluateTokenPolicy(rawToken: string | null | undefined): TokenPolicyVerdict {
  if (!rawToken) return { verdict: "deny", reason: "token_missing" };
  const parsed = parseConsentBoundToken(rawToken);
  if (!parsed) return { verdict: "deny", reason: "token_malformed_or_forged" };
  if (Date.parse(parsed.expiresAt) <= Date.now()) {
    return { verdict: "deny", reason: "token_expired" };
  }
  return {
    verdict: "allow",
    directiveId: parsed.directiveId,
    entityKey: parsed.entityKey,
  };
}
