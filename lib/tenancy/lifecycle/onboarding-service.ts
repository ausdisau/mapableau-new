import { prisma } from "@/lib/prisma";

const MIN_ONBOARDING_REASON_LENGTH = 10;

export interface StartOnboardingInput {
  organisationId: string;
  ownerUserId?: string | null;
  summary?: string | null;
  targetLaunchAt?: Date | null;
}

/** Onboarding cases are audit-only. Onboarding never auto-activates a tenant. */
export async function startOnboarding(input: StartOnboardingInput) {
  const org = await prisma.organisation.findUnique({
    where: { id: input.organisationId },
    select: { id: true, tenantStatus: true },
  });
  if (!org) throw new Error("ORGANISATION_NOT_FOUND");
  if (org.tenantStatus === "archived") {
    throw new Error("ORGANISATION_ARCHIVED_ONBOARDING_DENIED");
  }

  return prisma.$transaction(async (tx) => {
    const case_ = await tx.tenantOnboardingCase.create({
      data: {
        organisationId: input.organisationId,
        stage: "intake",
        ownerUserId: input.ownerUserId ?? null,
        summary: input.summary ?? null,
        targetLaunchAt: input.targetLaunchAt ?? null,
      },
    });

    await tx.organisation.update({
      where: { id: input.organisationId },
      data: { onboardingStartedAt: new Date() },
    });

    return case_;
  });
}

export function assertOnboardingReasonAcceptable(reason: string): void {
  if ((reason?.trim() ?? "").length < MIN_ONBOARDING_REASON_LENGTH) {
    throw new Error("ONBOARDING_REASON_TOO_SHORT");
  }
}
