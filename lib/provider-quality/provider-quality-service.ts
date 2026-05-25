import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { requireModuleEnabled } from "@/lib/feature-flags/require-module";

import { calculateQualitySignals } from "./quality-signal-calculator";
import { calculateProviderQualityScore } from "./quality-service";

export async function recalculateProviderQuality(
  organisationId: string,
  triggeredById?: string
) {
  await requireModuleEnabled("provider_quality_signals_enabled");

  const signals = await calculateQualitySignals(organisationId);

  const profile = await prisma.providerQualityProfile.upsert({
    where: { organisationId },
    create: { organisationId, publicLabel: signals[0]?.label },
    update: { publicLabel: signals[0]?.label, updatedAt: new Date() },
  });

  await prisma.providerQualitySignal.deleteMany({
    where: { profileId: profile.id },
  });

  for (const s of signals) {
    await prisma.providerQualitySignal.create({
      data: {
        profileId: profile.id,
        category: s.category,
        label: s.label,
        explanation: s.explanation,
        visiblePublic: s.visiblePublic,
        numericValue: s.numericValue,
      },
    });
  }

  await prisma.providerQualityCalculationRun.create({
    data: {
      profileId: profile.id,
      triggeredById,
      status: "completed",
    },
  });

  await createAuditEvent({
    actorUserId: triggeredById,
    action: "provider_quality.recalculated",
    entityType: "ProviderQualityProfile",
    entityId: profile.id,
    organisationId,
  });

  await calculateProviderQualityScore(organisationId);

  return { profile, signals };
}

export async function getPublicQualitySignals(organisationId: string) {
  const profile = await prisma.providerQualityProfile.findUnique({
    where: { organisationId },
    include: {
      signals: { where: { visiblePublic: true } },
    },
  });
  return (
    profile?.signals ?? [
      {
        label: "Quality information unavailable",
        explanation: "Signals will appear as the provider completes more services.",
      },
    ]
  );
}

export async function getProviderOwnQuality(organisationId: string) {
  return prisma.providerQualityProfile.findUnique({
    where: { organisationId },
    include: {
      signals: true,
      runs: { orderBy: { createdAt: "desc" }, take: 5 },
      feedback: { take: 10 },
    },
  });
}
