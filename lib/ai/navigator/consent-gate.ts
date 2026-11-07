/**
 * Navigator purpose-consent gate — thin caller of shared SoT helper.
 * @see lib/consent/purpose-consent.ts
 */

import { NAVIGATOR_AUDIT } from "@/lib/ai/navigator/gates";
import {
  verifyPurposeConsent as verifySharedPurposeConsent,
  type PurposeConsentVerificationInput,
  type PurposeConsentVerificationResult,
} from "@/lib/consent/purpose-consent";

export const NAVIGATOR_CONSENT_PURPOSE = "navigator.provider_search" as const;

export type {
  PurposeConsentVerificationInput,
  PurposeConsentVerificationResult,
};

/**
 * Verify purpose-specific consent before a protected Navigator read/tool call.
 * Uses ConsentRecord as sole SoT via shared helper.
 */
export async function verifyPurposeConsent(
  input: PurposeConsentVerificationInput,
): Promise<PurposeConsentVerificationResult> {
  return verifySharedPurposeConsent({
    ...input,
    auditUsedAction: NAVIGATOR_AUDIT.consentUsed,
    auditBlockedAction: NAVIGATOR_AUDIT.consentBlocked,
  });
}
