/**
 * One-off: migrate legacy Worker + WorkerProvider rows into WorkerProfile + AvailabilityWindow.
 * Run after profile_system_consolidation migration:
 *   npx tsx prisma/scripts/migrate-legacy-workers.ts
 */
import { PrismaClient } from "@prisma/client";

import { mapLegacyWorkerToProfileFields } from "../../lib/workers/migrate-legacy-worker-fields";

const prisma = new PrismaClient();

async function ensureProviderOrganisation(provider: {
  id: string;
  name: string;
  abn: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  serviceAreas: string[];
  ndisRegistered: boolean;
  ndisNumber: string | null;
  organisationId: string | null;
}) {
  if (provider.organisationId) {
    const org = await prisma.organisation.findUnique({
      where: { id: provider.organisationId },
    });
    if (org) return org.id;
  }

  const org = await prisma.organisation.create({
    data: {
      name: provider.name,
      abn: provider.abn,
      organisationType: "care_provider",
      contactEmail: provider.email,
      contactPhone: provider.phone,
      website: provider.website,
      serviceRegions: provider.serviceAreas,
      ndisRegistrationClaimed: provider.ndisRegistered,
      ndisRegistrationNumber: provider.ndisNumber,
      verificationStatus: "not_started",
      status: "active",
    },
  });

  await prisma.provider.update({
    where: { id: provider.id },
    data: { organisationId: org.id },
  });

  return org.id;
}

export async function migrateLegacyWorkers() {
  const links = await prisma.workerProvider.findMany({
    include: {
      worker: {
        include: {
          user: { select: { id: true, name: true } },
          languages: { select: { name: true } },
          specialisations: { select: { name: true } },
          availability: true,
        },
      },
      provider: true,
    },
  });

  let profilesUpserted = 0;
  let windowsCreated = 0;

  for (const link of links) {
    const { worker, provider } = link;
    const organisationId = await ensureProviderOrganisation(provider);

    const mapped = mapLegacyWorkerToProfileFields(worker);

    const existing = await prisma.workerProfile.findFirst({
      where: {
        userId: worker.userId,
        organisationId,
      },
    });

    let profileId: string;
    if (existing) {
      const updated = await prisma.workerProfile.update({
        where: { id: existing.id },
        data: {
          ...mapped,
          displayName: worker.user.name ?? existing.displayName,
          profileSummary: mapped.profileSummary ?? existing.profileSummary,
          qualificationsSummary:
            mapped.qualificationsSummary ?? existing.qualificationsSummary,
          languages:
            mapped.languages.length > 0 ? mapped.languages : existing.languages,
          specialisations:
            mapped.specialisations.length > 0
              ? mapped.specialisations
              : existing.specialisations,
        },
      });
      profileId = updated.id;
    } else {
      const created = await prisma.workerProfile.create({
        data: {
          userId: worker.userId,
          organisationId,
          ...mapped,
          displayName: worker.user.name ?? "Worker",
          verificationStatus: "pending_review",
          active: true,
        },
      });
      profileId = created.id;
      profilesUpserted++;
    }

    for (const slot of worker.availability) {
      const dup = await prisma.availabilityWindow.findFirst({
        where: {
          workerProfileId: profileId,
          organisationId,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
        },
      });
      if (!dup) {
        await prisma.availabilityWindow.create({
          data: {
            organisationId,
            workerProfileId: profileId,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            active: true,
          },
        });
        windowsCreated++;
      }
    }
  }

  console.log(
    `Legacy worker migration complete: ${profilesUpserted} new profiles, ${windowsCreated} availability windows.`,
  );
}

if (require.main === module) {
  migrateLegacyWorkers()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
