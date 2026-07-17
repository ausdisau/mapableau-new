import type { GovernedSystemType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type CreateGovernedSystemInput = {
  systemKey: string;
  displayName: string;
  systemType: GovernedSystemType;
  tenantId?: string;
  ownerUserId?: string;
  ownerTeam: string;
  businessPurpose: string;
  affectedPeopleSummary: string;
  decisionRole: string;
  actionRiskCeiling: string;
  prohibitedUses: Prisma.InputJsonValue;
  knownLimitations: string;
  incidentContact: string;
  legacyAlgorithmId?: string;
};

export type CreateGovernedSystemVersionInput = {
  systemId: string;
  versionKey: string;
  modelOrRulesVersion: string;
  promptVersion?: string;
  inputsJson: Prisma.InputJsonValue;
  outputsJson: Prisma.InputJsonValue;
  dataCategories: Prisma.InputJsonValue;
  humanOversightDescription: string;
  fairnessTestingSummary?: string;
  accessibilityTestingSummary?: string;
  securityTestingSummary?: string;
  privacyTestingSummary?: string;
  monitoringSummary?: string;
  sourceReference?: string;
  publicExplanation: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
};

export async function createGovernedSystem(input: CreateGovernedSystemInput) {
  return prisma.governedSystem.create({
    data: {
      ...input,
      status: "draft",
    },
  });
}

export async function getGovernedSystemByKey(systemKey: string) {
  return prisma.governedSystem.findUnique({
    where: { systemKey },
    include: {
      versions: { orderBy: { effectiveFrom: "desc" }, take: 5 },
      impactAssessments: { orderBy: { createdAt: "desc" }, take: 5 },
      registerEntries: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
}

export async function activateGovernedSystem(systemId: string) {
  return prisma.governedSystem.update({
    where: { id: systemId },
    data: { status: "active" },
  });
}

export async function suspendGovernedSystem(systemId: string, reason: string) {
  return prisma.governedSystem.update({
    where: { id: systemId },
    data: {
      status: "suspended",
      knownLimitations: reason,
    },
  });
}

export async function createGovernedSystemVersion(
  input: CreateGovernedSystemVersionInput,
) {
  return prisma.governedSystemVersion.create({
    data: input,
  });
}

export async function retireGovernedSystemVersion(
  versionId: string,
  retirementDate = new Date(),
) {
  return prisma.governedSystemVersion.update({
    where: { id: versionId },
    data: { retirementDate },
  });
}
