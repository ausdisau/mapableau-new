import type { ConsentScope as PrismaConsentScope } from "@prisma/client";

import { checkConsent } from "@/lib/consent/consent-service";
import type { ConsentScope } from "@/types/mapable";

import { evaluateConsentDirective } from "./evaluation";

/**
 * Compatibility boolean projection over the Wave 9 directive layer.
 *
 * The returned value ANDs the legacy `checkConsent` result (Wave 8 semantics
 * plus fail-closed grantee check) with an evaluation of any matching
 * directive. If a directive exists and denies / withdraws, the answer is
 * false regardless of whether the legacy record is still active.
 *
 * If neither exists, the answer is false (fail-closed).
 */
export async function checkConsentBooleanProjection(params: {
  subjectUserId: string;
  scope: ConsentScope;
  grantedToUserId?: string;
  grantedToOrganisationId?: string;
  purpose?: Parameters<typeof evaluateConsentDirective>[0]["purpose"];
  recipientCategory?: Parameters<
    typeof evaluateConsentDirective
  >[0]["recipientCategory"];
}): Promise<boolean> {
  const legacy = await checkConsent(params);

  if (params.purpose && params.recipientCategory) {
    const rich = await evaluateConsentDirective({
      subjectId: params.subjectUserId,
      recipientCategory: params.recipientCategory,
      recipientOrganisationId: params.grantedToOrganisationId ?? null,
      recipientEntityId: null,
      purpose: params.purpose,
      allowLegacyRecordFallback: false,
    });
    if (rich.verdict === "allowed") return legacy;
    if (
      rich.verdict === "denied" ||
      rich.verdict === "withdrawn" ||
      rich.verdict === "expired" ||
      rich.verdict === "one_time_already_used"
    ) {
      return false;
    }
  }

  return legacy;
}

export type { PrismaConsentScope };
