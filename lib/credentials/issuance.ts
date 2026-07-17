import { createHash } from "node:crypto";

import type {
  CredentialIssuanceMode,
  CredentialIssuanceOffer,
  IssuedCredential,
} from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { asJson } from "@/lib/prisma-json";

import { isProhibitedSchema } from "./schemas";

/**
 * Credential issuance in Wave 9 is *always* an offer first. A credential is
 * never auto-issued to a participant. The offer records the schema, purpose,
 * and issuance mode. The participant must accept before a credential is
 * minted, and the minted credential is `simulator=true` unless the
 * `FEDERATION_ACTIVATION` environment gate + a matching human-approved
 * `CredentialIssuanceMode != simulator_only` are both set.
 */

export interface CreateIssuanceOfferInput {
  subjectId: string;
  schemaKey: string;
  issuerOrganisationId?: string | null;
  mode?: CredentialIssuanceMode;
  purposeSummary: string;
  payload?: Record<string, unknown>;
  expiresAt?: Date;
  humanReviewer?: string;
  offeredById: string;
}

export async function createIssuanceOffer(
  input: CreateIssuanceOfferInput
): Promise<CredentialIssuanceOffer> {
  if (isProhibitedSchema(input.schemaKey)) {
    throw new Error("credential_schema_prohibited");
  }
  const schema = await prisma.credentialSchemaDefinition.findUnique({
    where: { schemaKey: input.schemaKey },
  });
  if (!schema) throw new Error("schema_not_found");
  if (!schema.isActive) throw new Error("schema_inactive");

  const offer = await prisma.credentialIssuanceOffer.create({
    data: {
      subjectId: input.subjectId,
      schemaId: schema.id,
      issuerOrganisationId: input.issuerOrganisationId ?? null,
      mode: input.mode ?? "simulator_only",
      purposeSummary: input.purposeSummary,
      status: "offered",
      payload: asJson(input.payload),
      expiresAt: input.expiresAt ?? undefined,
      humanReviewer: input.humanReviewer ?? undefined,
    },
  });
  await createAuditEvent({
    actorUserId: input.offeredById,
    action: "credential.issuance.offered",
    entityType: "CredentialIssuanceOffer",
    entityId: offer.id,
    participantId: input.subjectId,
    metadata: { schemaKey: input.schemaKey, mode: offer.mode },
  }).catch(() => {});
  return offer;
}

export interface AcceptIssuanceOfferInput {
  offerId: string;
  actorId: string;
}

export async function acceptIssuanceOffer(
  input: AcceptIssuanceOfferInput
): Promise<IssuedCredential> {
  const offer = await prisma.credentialIssuanceOffer.findUnique({
    where: { id: input.offerId },
  });
  if (!offer) throw new Error("offer_not_found");
  if (offer.status !== "offered") throw new Error("offer_not_pending");
  if (input.actorId !== offer.subjectId) {
    throw new Error("only_subject_can_accept_offer");
  }

  const simulator = offer.mode === "simulator_only" || !isFederationActivated();

  const subjectFingerprint = createHash("sha256")
    .update(`${offer.subjectId}:${offer.schemaId}:${offer.id}`)
    .digest("hex");

  const credential = await prisma.$transaction(async (tx) => {
    const created = await tx.issuedCredential.create({
      data: {
        subjectId: offer.subjectId,
        schemaId: offer.schemaId,
        issuerOrganisationId: offer.issuerOrganisationId,
        credentialSubject: (offer.payload as object) ?? {},
        claimHash: subjectFingerprint,
        proofType: simulator ? "simulator.sha256" : "unknown",
        simulator,
        offerId: offer.id,
      },
    });
    await tx.credentialIssuanceOffer.update({
      where: { id: offer.id },
      data: { status: "issued", respondedAt: new Date() },
    });
    return created;
  });

  await createAuditEvent({
    actorUserId: input.actorId,
    action: "credential.issued",
    entityType: "IssuedCredential",
    entityId: credential.id,
    participantId: offer.subjectId,
    metadata: { simulator: credential.simulator, offerId: offer.id },
  }).catch(() => {});

  return credential;
}

export function isFederationActivated(): boolean {
  return process.env.FEDERATION_ACTIVATION === "true";
}

export async function revokeIssuedCredential(
  credentialId: string,
  actorId: string,
  reason?: string
): Promise<IssuedCredential> {
  const updated = await prisma.issuedCredential.update({
    where: { id: credentialId },
    data: { revokedAt: new Date() },
  });
  await createAuditEvent({
    actorUserId: actorId,
    action: "credential.revoked",
    entityType: "IssuedCredential",
    entityId: credentialId,
    participantId: updated.subjectId,
    metadata: { reason: reason ?? null },
  }).catch(() => {});
  return updated;
}

/**
 * Guardrail: Wave 9 forbids auto-issue on data change. If any pipeline is
 * tempted to auto-mint a credential, it must call this function first, which
 * throws unless an operator sets an explicit override.
 */
export function refuseAutoIssue(context: string) {
  if (process.env.FEDERATION_ALLOW_AUTO_ISSUE === "true") return;
  throw new Error(
    `auto_issue_refused_by_policy: ${context} — Wave 9 requires an explicit participant-accepted offer.`
  );
}
