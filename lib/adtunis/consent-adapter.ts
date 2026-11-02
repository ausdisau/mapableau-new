
import {
  checkConsent,
  grantConsent,
  revokeConsent,
} from "@/lib/consent/consent-service";
import { consentScopeToPrisma } from "@/lib/consent/scope-map";
import { prisma } from "@/lib/prisma";
import type { ConsentScope } from "@/types/mapable";
import {
  ADTUNIS_CONSENT_SCOPES,
  type AdtunisConsent,
} from "@mapable/adtunis-core";

const PURPOSE: Record<keyof AdtunisConsent | "audioRetain", string> = {
  transcription:
    "Adtunis speech transcription for participant-controlled composition",
  personalisation:
    "Adtunis personal vocabulary / adaptation (never auto-trains)",
  research: "Adtunis research participation (separate from service delivery)",
  audioRetain: "Adtunis private audio retention",
};

async function setScope(params: {
  participantId: string;
  scope: ConsentScope;
  granted: boolean;
  purpose: string;
}) {
  if (params.granted) {
    const already = await checkConsent({
      subjectUserId: params.participantId,
      scope: params.scope,
    });
    if (!already) {
      await grantConsent({
        subjectUserId: params.participantId,
        scope: params.scope,
        purpose: params.purpose,
        createdById: params.participantId,
        recordDisclosureOnGrant: false,
      });
    }
    return;
  }

  const active = await prisma.consentRecord.findFirst({
    where: {
      subjectUserId: params.participantId,
      status: "active",
      scope: consentScopeToPrisma(params.scope),
    },
    orderBy: { createdAt: "desc" },
  });
  if (active) {
    await revokeConsent(active.id, params.participantId);
  }
}

export async function syncAdtunisConsentToMapAble(params: {
  participantId: string;
  consent: AdtunisConsent;
  audioRetain?: boolean;
}) {
  await setScope({
    participantId: params.participantId,
    scope: ADTUNIS_CONSENT_SCOPES.transcription as ConsentScope,
    granted: params.consent.transcription,
    purpose: PURPOSE.transcription,
  });
  await setScope({
    participantId: params.participantId,
    scope: ADTUNIS_CONSENT_SCOPES.personalisation as ConsentScope,
    granted: params.consent.personalisation,
    purpose: PURPOSE.personalisation,
  });
  await setScope({
    participantId: params.participantId,
    scope: ADTUNIS_CONSENT_SCOPES.research as ConsentScope,
    granted: params.consent.research,
    purpose: PURPOSE.research,
  });
  if (typeof params.audioRetain === "boolean") {
    await setScope({
      participantId: params.participantId,
      scope: ADTUNIS_CONSENT_SCOPES.audioRetain as ConsentScope,
      granted: params.audioRetain,
      purpose: PURPOSE.audioRetain,
    });
  }
}

export async function readMapAbleAdtunisConsent(
  participantId: string,
): Promise<AdtunisConsent> {
  const [transcription, personalisation, research] = await Promise.all([
    checkConsent({
      subjectUserId: participantId,
      scope: ADTUNIS_CONSENT_SCOPES.transcription as ConsentScope,
    }),
    checkConsent({
      subjectUserId: participantId,
      scope: ADTUNIS_CONSENT_SCOPES.personalisation as ConsentScope,
    }),
    checkConsent({
      subjectUserId: participantId,
      scope: ADTUNIS_CONSENT_SCOPES.research as ConsentScope,
    }),
  ]);
  return { transcription, personalisation, research };
}
