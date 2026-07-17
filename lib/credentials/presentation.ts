import { randomUUID } from "node:crypto";

import type {
  CredentialPresentation,
  CredentialPresentationRequest,
  IssuedCredential,
} from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { asJson } from "@/lib/prisma-json";

import { isFederationActivated } from "./issuance";

export interface CreatePresentationRequestInput {
  verifierOrganisationId?: string | null;
  externalVerifierEntityKey?: string | null;
  purposeSummary: string;
  requestedClaims: Record<string, unknown>;
  expiresAt?: Date;
  createdById: string;
}

/**
 * Verifier-initiated presentation request. The verifier states what claims
 * it wants (by field path or credential type). The participant reviews the
 * request in their wallet before any presentation is minted.
 *
 * Simulator flag is always set true unless federation activation is on AND
 * the verifier is `allowed_verifier` or higher in the trust registry.
 */
export async function createPresentationRequest(
  input: CreatePresentationRequestInput
): Promise<CredentialPresentationRequest> {
  const externalVerifier = input.externalVerifierEntityKey
    ? await prisma.externalFederationEntity.findUnique({
        where: { entityKey: input.externalVerifierEntityKey },
      })
    : null;

  const simulator = !isFederationActivated();

  const request = await prisma.credentialPresentationRequest.create({
    data: {
      verifierOrganisationId: input.verifierOrganisationId ?? null,
      externalVerifierId: externalVerifier?.id ?? null,
      purposeSummary: input.purposeSummary,
      requestedClaims: asJson(input.requestedClaims) ?? {},
      challenge: randomUUID(),
      status: "requested",
      simulator,
      expiresAt: input.expiresAt ?? undefined,
    },
  });
  await createAuditEvent({
    actorUserId: input.createdById,
    action: "credential.presentation.requested",
    entityType: "CredentialPresentationRequest",
    entityId: request.id,
    metadata: {
      simulator,
      verifierOrganisationId: input.verifierOrganisationId ?? null,
    },
  }).catch(() => {});
  return request;
}

export interface CreatePresentationInput {
  requestId: string;
  subjectId: string;
  credentialId?: string | null;
  disclosureManifestId?: string | null;
  disclosedClaims?: Record<string, unknown>;
}

export async function createPresentation(
  input: CreatePresentationInput
): Promise<CredentialPresentation> {
  const request = await prisma.credentialPresentationRequest.findUnique({
    where: { id: input.requestId },
  });
  if (!request) throw new Error("request_not_found");
  if (
    request.status !== "requested" &&
    request.status !== "approved_by_participant"
  ) {
    throw new Error("request_not_in_valid_state");
  }

  let credential: IssuedCredential | null = null;
  if (input.credentialId) {
    credential = await prisma.issuedCredential.findUnique({
      where: { id: input.credentialId },
    });
    if (!credential) throw new Error("credential_not_found");
    if (credential.subjectId !== input.subjectId) {
      throw new Error("credential_subject_mismatch");
    }
  }

  const presentation = await prisma.$transaction(async (tx) => {
    const created = await tx.credentialPresentation.create({
      data: {
        requestId: input.requestId,
        subjectId: input.subjectId,
        credentialId: credential?.id ?? null,
        disclosureManifestId: input.disclosureManifestId ?? null,
        status: "presented",
        disclosedClaims: asJson(input.disclosedClaims),
        simulator: request.simulator,
        presentedAt: new Date(),
      },
    });
    await tx.credentialPresentationRequest.update({
      where: { id: input.requestId },
      data: { status: "presented" },
    });
    return created;
  });
  return presentation;
}
