import type {
  AccessAssistanceMode,
  AccessContextScope,
  AccessCriticality,
  AccessDomain,
  AccessPassportVisibility,
  AccessTiming,
  Prisma,
} from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

import { mapPassport, mapRequirement } from "./mappers";
import type { AccessPassport, AccessRequirement } from "./types";

function toJsonValue(
  value: string | number | boolean | undefined,
): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  return value;
}

export type PassportRequirementInput = {
  id?: string;
  ontologyConceptId: string;
  domain: AccessDomain;
  attribute: string;
  comparator?: string | null;
  value?: string | number | boolean;
  unit?: string | null;
  criticality: AccessCriticality;
  contextScope?: AccessContextScope;
  timing?: AccessTiming;
  assistance?: AccessAssistanceMode;
  disclosureScopes?: string[];
  userConfirmed?: boolean;
  acceptableAdjustmentIds?: string[];
  notes?: string;
  _delete?: boolean;
};

export type PassportPatchInput = {
  visibilityDefault?: AccessPassportVisibility;
  requirements?: PassportRequirementInput[];
};

async function loadPassport(userId: string) {
  return prisma.accessPassport.findUnique({
    where: { userId },
    include: { requirements: { orderBy: { createdAt: "asc" } } },
  });
}

export async function getOrCreateAccessPassport(
  userId: string,
): Promise<AccessPassport> {
  let row = await loadPassport(userId);
  if (!row) {
    await prisma.accessPassport.create({
      data: {
        userId,
        visibilityDefault: "private",
        containsDiagnosis: false,
      },
    });
    row = await loadPassport(userId);
  }
  if (!row) {
    throw new Error("Failed to create Access Passport");
  }
  // Matching payloads must never treat diagnosis as an input.
  if (row.containsDiagnosis) {
    await prisma.accessPassport.update({
      where: { id: row.id },
      data: { containsDiagnosis: false },
    });
    row = { ...row, containsDiagnosis: false };
  }
  return mapPassport(row);
}

export async function getAccessPassportForUser(
  userId: string,
): Promise<AccessPassport | null> {
  const row = await loadPassport(userId);
  if (!row) return null;
  return mapPassport({ ...row, containsDiagnosis: false });
}

export async function patchAccessPassport(input: {
  userId: string;
  actorRole: string;
  patch: PassportPatchInput;
}): Promise<AccessPassport> {
  const passport = await getOrCreateAccessPassport(input.userId);

  if (input.patch.visibilityDefault) {
    await prisma.accessPassport.update({
      where: { id: passport.id },
      data: {
        visibilityDefault: input.patch.visibilityDefault,
        containsDiagnosis: false,
      },
    });
  }

  if (input.patch.requirements) {
    for (const req of input.patch.requirements) {
      if (req._delete) {
        if (!req.id) continue;
        await prisma.accessRequirementRecord.deleteMany({
          where: { id: req.id, passportId: passport.id },
        });
        continue;
      }

      const valueJson = toJsonValue(req.value);
      const data = {
        ontologyConceptId: req.ontologyConceptId,
        domain: req.domain,
        attribute: req.attribute,
        comparator: req.comparator ?? null,
        ...(valueJson !== undefined ? { valueJson } : {}),
        unit: req.unit ?? null,
        criticality: req.criticality,
        contextScope: req.contextScope ?? ("always" as const),
        timing: req.timing ?? ("permanent" as const),
        assistance: req.assistance ?? ("independent" as const),
        disclosureScopes: req.disclosureScopes ?? ["private"],
        userConfirmed: req.userConfirmed ?? true,
        acceptableAdjustmentIds: req.acceptableAdjustmentIds ?? [],
        notes: req.notes ?? null,
      };

      if (req.id) {
        await prisma.accessRequirementRecord.updateMany({
          where: { id: req.id, passportId: passport.id },
          data,
        });
      } else {
        await prisma.accessRequirementRecord.create({
          data: {
            passportId: passport.id,
            ...data,
          },
        });
      }
    }
  }

  await createAuditEvent({
    actorUserId: input.userId,
    actorRole: input.actorRole as never,
    action: "access_passport.updated",
    entityType: "AccessPassport",
    entityId: passport.id,
    participantId: input.userId,
  });

  return getOrCreateAccessPassport(input.userId);
}

export function toPassportApiResponse(passport: AccessPassport) {
  return {
    schemaVersion: "1.0" as const,
    id: passport.id,
    participantId: passport.userId,
    visibilityDefault: passport.visibilityDefault,
    containsDiagnosis: false as const,
    requirements: passport.requirements.map(toRequirementApi),
    createdAt: passport.createdAt,
    updatedAt: passport.updatedAt,
  };
}

function toRequirementApi(req: AccessRequirement) {
  return {
    schemaVersion: "1.0" as const,
    id: req.id,
    passportId: req.passportId,
    ontologyConceptId: req.ontologyConceptId,
    domain: req.domain,
    attribute: req.attribute,
    comparator: req.comparator,
    value: req.value,
    unit: req.unit ?? null,
    criticality: req.criticality,
    contextScope: req.contextScope,
    timing: req.timing,
    assistance: req.assistance,
    disclosureScopes: req.disclosureScopes,
    userConfirmed: req.userConfirmed,
    acceptableAdjustmentIds: req.acceptableAdjustmentIds,
    notes: req.notes,
  };
}

/** Export mapper for tests / adapters. */
export { mapRequirement };
