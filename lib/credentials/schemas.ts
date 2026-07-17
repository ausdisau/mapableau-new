import type {
  CredentialSchemaDefinition,
  CredentialSchemaKind,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { asJson } from "@/lib/prisma-json";

/**
 * MapAble credential schemas.
 *
 * Wave 9 rule: MapAble is NOT a government issuer. The schema names below
 * are permanently prohibited so that participants cannot be misled and so
 * that no operator can accidentally spin up an issuer that mimics a
 * government credential.
 */

export const PROHIBITED_SCHEMA_KEYS = new Set<string>([
  "NDISParticipantCredential",
  "NDISWorkerCredential",
  "MedicalDiagnosisCredential",
  "DisabilityCredential",
  "DriverLicenceCredential",
  "MedicareCredential",
  "PassportCredential",
]);

export function isProhibitedSchema(schemaKey: string): boolean {
  return PROHIBITED_SCHEMA_KEYS.has(schemaKey);
}

export interface UpsertSchemaInput {
  schemaKey: string;
  displayName: string;
  kind: CredentialSchemaKind;
  version: string;
  authorId?: string | null;
  attributeShape: Record<string, unknown>;
  proofRules?: Record<string, unknown> | null;
  notes?: string | null;
}

export async function upsertCredentialSchema(
  input: UpsertSchemaInput
): Promise<CredentialSchemaDefinition> {
  if (isProhibitedSchema(input.schemaKey)) {
    throw new Error(
      `credential_schema_prohibited: ${input.schemaKey} — MapAble is not a government issuer`
    );
  }
  return prisma.credentialSchemaDefinition.upsert({
    where: { schemaKey: input.schemaKey },
    create: {
      schemaKey: input.schemaKey,
      displayName: input.displayName,
      kind: input.kind,
      version: input.version,
      authorId: input.authorId ?? null,
      attributeShape: asJson(input.attributeShape) ?? {},
      proofRules: asJson(input.proofRules ?? undefined),
      isGovernment: false,
      notes: input.notes ?? null,
    },
    update: {
      displayName: input.displayName,
      version: input.version,
      attributeShape: asJson(input.attributeShape) ?? {},
      proofRules: asJson(input.proofRules ?? undefined),
      notes: input.notes ?? null,
    },
  });
}

export async function listActiveSchemas() {
  return prisma.credentialSchemaDefinition.findMany({
    where: { isActive: true },
    orderBy: [{ kind: "asc" }, { displayName: "asc" }],
  });
}
