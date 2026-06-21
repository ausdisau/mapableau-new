import { checkConsent } from "@/lib/consent/consent-service";
import type { ConsentScope } from "@/types/mapable";

export type ConsentGateResult =
  | { allowed: true }
  | {
      allowed: false;
      requiredConfirmations: Array<{
        type: "CONSENT_CONFIRMATION";
        title: string;
        explanation: string;
      }>;
    };

export async function checkConsentGate(params: {
  participantId?: string | null;
  scopes?: ConsentScope[];
}): Promise<ConsentGateResult> {
  if (!params.participantId || !params.scopes?.length) {
    return { allowed: true };
  }

  for (const scope of params.scopes) {
    const allowed = await checkConsent({
      subjectUserId: params.participantId,
      scope,
    });
    if (!allowed) {
      return {
        allowed: false,
        requiredConfirmations: [
          {
            type: "CONSENT_CONFIRMATION",
            title: "Consent required",
            explanation: `We need your approval to use ${scope.replace(/_/g, " ")} before continuing.`,
          },
        ],
      };
    }
  }

  return { allowed: true };
}
