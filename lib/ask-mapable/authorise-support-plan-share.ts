import { buildSupportPlanShareAuthorisationConsent, type SupportPlanShareAuthorisationInput, type SupportPlanShareAuthorisationIssue } from "@/lib/ask-mapable/support-plan-share-authorisation";
import { grantConsent } from "@/lib/consent/consent-service";

export type AuthoriseSupportPlanShareInput = {
  subjectUserId: string;
  actorUserId: string;
  envelope: SupportPlanShareAuthorisationInput;
  now?: Date;
};

export type AuthoriseSupportPlanShareResult =
  | {
      ok: true;
      consentRecordId: string;
      authorisation: {
        envelopeId: string;
        recipientKind: "mapable_human";
        purpose: string;
        selectedFields: string[];
        expiresAt: string;
        transmissionAuthorised: true;
        deliveryState: "NOT_SENT";
        sent: false;
        externalAcceptanceConfirmed: false;
      };
    }
  | { ok: false; issues: SupportPlanShareAuthorisationIssue[] };

/**
 * Persists only the authority metadata needed for a future disclosure. The
 * participant-authored support-plan narrative is deliberately not accepted by
 * this service and is never copied into the ConsentRecord or audit metadata.
 *
 * The envelope id is bound into sourceAction so a later transmission service
 * can prove that the consent presented belongs to this exact prepared envelope.
 * Creating this record does not send, disclose or imply receipt of any content.
 */
export async function authoriseSupportPlanShare(
  input: AuthoriseSupportPlanShareInput,
): Promise<AuthoriseSupportPlanShareResult> {
  const built = buildSupportPlanShareAuthorisationConsent(
    input.envelope,
    input.now ?? new Date(),
  );

  if (!built.ok) return built;

  const { consent, authorisation } = built;
  const record = await grantConsent({
    subjectUserId: input.subjectUserId,
    createdById: input.actorUserId,
    scope: consent.scope,
    purpose: consent.purpose,
    shareMode: consent.shareMode,
    recipientType: consent.recipientType,
    dataScope: [...consent.dataScope],
    sourceAction: `${consent.sourceAction}:${authorisation.envelopeId}`,
    expiryDate: consent.expiryDate,
    recordDisclosureOnGrant: consent.recordDisclosureOnGrant,
  });

  return {
    ok: true,
    consentRecordId: record.id,
    authorisation: {
      ...authorisation,
      selectedFields: [...authorisation.selectedFields],
    },
  };
}
