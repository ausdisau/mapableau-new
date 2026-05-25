import type { PanelActor } from "@/lib/access-control/panel-access";
import { assertParticipantSelfAccess } from "@/lib/access-control/panel-access";
import { grantConsent, revokeConsent } from "@/lib/consent/consent-service";
import { prisma } from "@/lib/prisma";
import type { ConsentScope } from "@/types/mapable";

export async function getConsentCentreSummary(actor: PanelActor) {
  await assertParticipantSelfAccess(actor, actor.id, "ConsentRecord");

  const records = await prisma.consentRecord.findMany({
    where: { subjectUserId: actor.id },
    orderBy: { updatedAt: "desc" },
    include: {
      grantedToOrganisation: { select: { id: true, name: true } },
      grantedToUser: { select: { id: true, name: true } },
    },
  });

  const active = records.filter((r) => r.status === "active").length;
  const expiringSoon = records.filter(
    (r) =>
      r.status === "active" &&
      r.expiryDate &&
      r.expiryDate.getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000
  ).length;

  return { records, active, expiringSoon };
}

export async function grantParticipantConsent(
  actor: PanelActor,
  input: {
    grantedToOrganisationId?: string;
    grantedToUserId?: string;
    scope: ConsentScope;
    purpose: string;
    expiryDate?: Date;
  }
) {
  await assertParticipantSelfAccess(actor, actor.id, "ConsentRecord", "grant");
  return grantConsent({
    subjectUserId: actor.id,
    ...input,
    createdById: actor.id,
  });
}

export async function revokeParticipantConsent(
  actor: PanelActor,
  consentId: string
) {
  await assertParticipantSelfAccess(actor, actor.id, "ConsentRecord", consentId);
  return revokeConsent(consentId, actor.id);
}
