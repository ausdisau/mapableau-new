import type {
  AccessAssistanceMode,
  AccessContextScope,
  AccessCriticality,
  AccessDomain,
  AccessTiming,
} from "@/lib/access/infrastructure/domains";
import type { AccessPassport, AccessRequirement } from "@/lib/access/infrastructure/types";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

function asJsonValue(
  value: string | number | boolean | undefined | null,
): string | number | boolean | null {
  if (value === undefined) return null;
  return value;
}

function mapRequirement(row: {
  id: string;
  passportId: string;
  ontologyConceptId: string;
  domain: AccessDomain;
  attribute: string;
  comparator: string | null;
  valueJson: unknown;
  unit: string | null;
  criticality: AccessCriticality;
  contextScope: AccessContextScope;
  timing: AccessTiming;
  assistance: AccessAssistanceMode;
  disclosureScopes: string[];
  userConfirmed: boolean;
  acceptableAdjustmentIds: string[];
  notes: string | null;
}): AccessRequirement {
  return {
    id: row.id,
    passportId: row.passportId,
    ontologyConceptId: row.ontologyConceptId,
    domain: row.domain,
    attribute: row.attribute,
    comparator: (row.comparator as AccessRequirement["comparator"]) ?? undefined,
    value:
      typeof row.valueJson === "string" ||
      typeof row.valueJson === "number" ||
      typeof row.valueJson === "boolean"
        ? row.valueJson
        : undefined,
    unit: row.unit,
    criticality: row.criticality,
    contextScope: row.contextScope,
    timing: row.timing,
    assistance: row.assistance,
    disclosureScopes: row.disclosureScopes as AccessRequirement["disclosureScopes"],
    userConfirmed: row.userConfirmed,
    acceptableAdjustmentIds: row.acceptableAdjustmentIds,
    notes: row.notes ?? undefined,
  };
}

export async function getOrCreatePassport(userId: string): Promise<AccessPassport> {
  const existing = await prisma.accessPassport.findUnique({
    where: { userId },
    include: { requirements: true },
  });
  if (existing) {
    return {
      id: existing.id,
      userId: existing.userId,
      visibilityDefault: existing.visibilityDefault,
      containsDiagnosis: false,
      requirements: existing.requirements.map(mapRequirement),
      createdAt: existing.createdAt.toISOString(),
      updatedAt: existing.updatedAt.toISOString(),
    };
  }

  const created = await prisma.accessPassport.create({
    data: {
      userId,
      visibilityDefault: "private",
      containsDiagnosis: false,
    },
    include: { requirements: true },
  });

  await prisma.accessChangeEventRecord.create({
    data: {
      passportId: created.id,
      eventType: "passport_updated",
      actorUserId: userId,
      entityType: "AccessPassport",
      entityId: created.id,
      summary: "Passport created",
    },
  });

  await createAuditEvent({
    actorUserId: userId,
    action: "ACCESS_PASSPORT_CREATED",
    entityType: "AccessPassport",
    entityId: created.id,
    participantId: userId,
    metadata: { containsDiagnosis: false },
  });

  return {
    id: created.id,
    userId: created.userId,
    visibilityDefault: created.visibilityDefault,
    containsDiagnosis: false,
    requirements: [],
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  };
}

export async function getPassportForUser(userId: string): Promise<AccessPassport | null> {
  const existing = await prisma.accessPassport.findUnique({
    where: { userId },
    include: { requirements: true },
  });
  if (!existing) return null;
  return {
    id: existing.id,
    userId: existing.userId,
    visibilityDefault: existing.visibilityDefault,
    containsDiagnosis: false,
    requirements: existing.requirements.map(mapRequirement),
    createdAt: existing.createdAt.toISOString(),
    updatedAt: existing.updatedAt.toISOString(),
  };
}

export type CreateRequirementInput = {
  ontologyConceptId: string;
  domain: AccessDomain;
  attribute: string;
  comparator?: string;
  value?: string | number | boolean;
  unit?: string;
  criticality: AccessCriticality;
  contextScope?: AccessContextScope;
  timing?: AccessTiming;
  assistance?: AccessAssistanceMode;
  disclosureScopes?: string[];
  userConfirmed?: boolean;
  notes?: string;
};

export async function addRequirement(
  userId: string,
  input: CreateRequirementInput,
): Promise<AccessRequirement> {
  const passport = await getOrCreatePassport(userId);
  const row = await prisma.accessRequirementRecord.create({
    data: {
      passportId: passport.id,
      ontologyConceptId: input.ontologyConceptId,
      domain: input.domain,
      attribute: input.attribute,
      comparator: input.comparator,
      valueJson: asJsonValue(input.value),
      unit: input.unit,
      criticality: input.criticality,
      contextScope: input.contextScope ?? "always",
      timing: input.timing ?? "permanent",
      assistance: input.assistance ?? "independent",
      disclosureScopes: input.disclosureScopes ?? [],
      userConfirmed: input.userConfirmed ?? false,
      notes: input.notes,
    },
  });

  await prisma.accessChangeEventRecord.create({
    data: {
      passportId: passport.id,
      eventType: "requirement_created",
      actorUserId: userId,
      entityType: "AccessRequirement",
      entityId: row.id,
      summary: `Requirement added: ${input.ontologyConceptId}`,
      metadataJson: { domain: input.domain, criticality: input.criticality },
    },
  });

  await createAuditEvent({
    actorUserId: userId,
    action: "ACCESS_REQUIREMENT_CREATED",
    entityType: "AccessRequirement",
    entityId: row.id,
    participantId: userId,
    metadata: { ontologyConceptId: input.ontologyConceptId, criticality: input.criticality },
  });

  return mapRequirement(row);
}

export async function updateRequirement(
  userId: string,
  requirementId: string,
  patch: Partial<CreateRequirementInput>,
): Promise<AccessRequirement | null> {
  const passport = await getPassportForUser(userId);
  if (!passport) return null;
  const existing = await prisma.accessRequirementRecord.findFirst({
    where: { id: requirementId, passportId: passport.id },
  });
  if (!existing) return null;

  const row = await prisma.accessRequirementRecord.update({
    where: { id: requirementId },
    data: {
      ontologyConceptId: patch.ontologyConceptId,
      domain: patch.domain,
      attribute: patch.attribute,
      comparator: patch.comparator,
      valueJson:
        patch.value !== undefined ? asJsonValue(patch.value) : undefined,
      unit: patch.unit,
      criticality: patch.criticality,
      contextScope: patch.contextScope,
      timing: patch.timing,
      assistance: patch.assistance,
      disclosureScopes: patch.disclosureScopes,
      userConfirmed: patch.userConfirmed,
      notes: patch.notes,
    },
  });

  await prisma.accessChangeEventRecord.create({
    data: {
      passportId: passport.id,
      eventType: "requirement_updated",
      actorUserId: userId,
      entityType: "AccessRequirement",
      entityId: row.id,
      summary: `Requirement updated: ${row.ontologyConceptId}`,
    },
  });

  await createAuditEvent({
    actorUserId: userId,
    action: "ACCESS_REQUIREMENT_UPDATED",
    entityType: "AccessRequirement",
    entityId: row.id,
    participantId: userId,
    metadata: { ontologyConceptId: row.ontologyConceptId },
  });

  return mapRequirement(row);
}

export async function deleteRequirement(
  userId: string,
  requirementId: string,
): Promise<boolean> {
  const passport = await getPassportForUser(userId);
  if (!passport) return false;
  const existing = await prisma.accessRequirementRecord.findFirst({
    where: { id: requirementId, passportId: passport.id },
  });
  if (!existing) return false;

  await prisma.accessRequirementRecord.delete({ where: { id: requirementId } });

  await prisma.accessChangeEventRecord.create({
    data: {
      passportId: passport.id,
      eventType: "requirement_deleted",
      actorUserId: userId,
      entityType: "AccessRequirement",
      entityId: requirementId,
      summary: `Requirement deleted: ${existing.ontologyConceptId}`,
    },
  });

  await createAuditEvent({
    actorUserId: userId,
    action: "ACCESS_REQUIREMENT_DELETED",
    entityType: "AccessRequirement",
    entityId: requirementId,
    participantId: userId,
    metadata: { ontologyConceptId: existing.ontologyConceptId },
  });

  return true;
}
