import type { AssuranceFrameworkKind, SecurityFrameworkType } from "@prisma/client";

import { ASSURANCE_CATALOGUES } from "@/lib/assurance/frameworks/catalogue-seed";
import { assuranceConfig } from "@/lib/config/assurance";
import { prisma } from "@/lib/prisma";

function kindToLegacyType(kind: AssuranceFrameworkKind): SecurityFrameworkType {
  switch (kind) {
    case "soc2_readiness":
      return "soc2";
    case "iso27001_readiness":
      return "iso27001";
    case "privacy_act_app":
      return "privacy_act";
    case "ndis_quality_safeguards":
      return "ndis_quality_safeguards";
    case "internal_baseline":
    case "ndia_digital_platform":
    case "essential_eight_aligned":
    case "other":
      return "internal";
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

export async function seedAssuranceFrameworks(params?: {
  ownerUserId?: string | null;
}) {
  if (!assuranceConfig.evaluationEnabled) {
    return { seeded: 0, frameworks: [] as Awaited<ReturnType<typeof prisma.securityFramework.findMany>> };
  }

  const frameworks = [];
  for (const catalogue of ASSURANCE_CATALOGUES) {
    let framework = await prisma.securityFramework.findFirst({
      where: { kind: catalogue.kind, name: catalogue.name },
    });

    if (!framework) {
      framework = await prisma.securityFramework.create({
        data: {
          type: kindToLegacyType(catalogue.kind),
          kind: catalogue.kind,
          name: catalogue.name,
          version: catalogue.version,
          sourceLabel: catalogue.sourceLabel,
          scopeStatement: catalogue.scopeStatement,
          ownerUserId: params?.ownerUserId ?? null,
          active: true,
        },
      });
    }

    for (const control of catalogue.controls) {
      const existing = await prisma.securityControl.findFirst({
        where: { frameworkId: framework.id, controlCode: control.controlCode },
      });
      if (!existing) {
        await prisma.securityControl.create({
          data: {
            frameworkId: framework.id,
            code: control.controlCode,
            controlCode: control.controlCode,
            title: control.title,
            objective: control.objective,
            testingFrequency: control.testingFrequency,
            evidenceFreshnessDays: control.evidenceFreshnessDays,
            status: "not_started",
            assuranceStatus: "not_started",
          },
        });
      }
    }

    frameworks.push(framework);
  }

  return { seeded: frameworks.length, frameworks };
}

export async function listAssuranceFrameworks() {
  return prisma.securityFramework.findMany({
    where: { active: true },
    include: {
      controls: {
        select: {
          id: true,
          controlCode: true,
          title: true,
          assuranceStatus: true,
          evidenceFreshnessDays: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getAssuranceFramework(id: string) {
  return prisma.securityFramework.findUnique({
    where: { id },
    include: {
      controls: {
        include: {
          assuranceEvidence: { where: { isCurrent: true }, take: 10 },
          tests: { where: { active: true }, include: { runs: { take: 1, orderBy: { executedAt: "desc" } } } },
          exceptions: { where: { status: "approved" } },
        },
      },
    },
  });
}
