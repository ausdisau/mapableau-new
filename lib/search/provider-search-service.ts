import { prisma } from "@/lib/prisma";
import { getPublicQualitySignals } from "@/lib/provider-quality/provider-quality-service";
import { isModuleEnabled } from "@/lib/feature-flags/server-feature-flag";

export type ProviderSearchFilters = {
  serviceRegion?: string;
  serviceType?: string;
  wheelchairAccessible?: boolean;
  verificationStatus?: string;
  language?: string;
  organisationType?: string;
};

export async function searchCareProviders(filters: ProviderSearchFilters) {
  const orgs = await prisma.organisation.findMany({
    where: {
      organisationType: "care_provider",
      status: "active",
      ...(filters.verificationStatus
        ? { verificationStatus: filters.verificationStatus as never }
        : {}),
      ...(filters.serviceRegion
        ? { serviceRegions: { has: filters.serviceRegion } }
        : {}),
    },
    take: 50,
    orderBy: { name: "asc" },
  });

  const qualityEnabled = await isModuleEnabled("provider_quality_signals_enabled");
  const capacityEnabled = await isModuleEnabled("waitlist_exchange_enabled");

  return Promise.all(
    orgs.map(async (o) => {
      const capacity = capacityEnabled
        ? await prisma.providerCapacityBlock.findFirst({
            where: {
              organisationId: o.id,
              acceptingNewParticipants: true,
            },
          })
        : null;
      const qualitySignals = qualityEnabled
        ? await getPublicQualitySignals(o.id)
        : [];

      return {
        id: o.id,
        name: o.name,
        organisationType: o.organisationType,
        verificationStatus: o.verificationStatus,
        verificationCaution:
          o.verificationStatus !== "verified"
            ? "This provider is not fully verified. Details require review."
            : null,
        serviceRegions: o.serviceRegions,
        acceptingNewParticipants: Boolean(capacity),
        qualitySignals: qualitySignals.map((s) =>
          "label" in s ? s.label : (s as { label: string }).label
        ),
      };
    })
  );
}

export async function searchTransportOperators(filters: ProviderSearchFilters) {
  const orgs = await prisma.organisation.findMany({
    where: {
      organisationType: "transport_provider",
      status: "active",
    },
    take: 50,
  });

  const vehicles = filters.wheelchairAccessible
    ? await prisma.vehicle.findMany({
        where: { wheelchairAccessible: true, active: true },
        select: { organisationId: true },
      })
    : [];

  const orgIdsWithWav = new Set(vehicles.map((v) => v.organisationId));

  return orgs
    .filter(
      (o) =>
        !filters.wheelchairAccessible || orgIdsWithWav.has(o.id)
    )
    .map((o) => ({
      id: o.id,
      name: o.name,
      verificationStatus: o.verificationStatus,
      verificationCaution:
        o.verificationStatus !== "verified"
          ? "Verification pending — confirm suitability before booking."
          : null,
    }));
}

export async function searchWorkersPublic(filters: ProviderSearchFilters) {
  return prisma.workerProfile.findMany({
    where: {
      active: true,
      ...(filters.serviceType
        ? { serviceTypes: { has: filters.serviceType } }
        : {}),
      ...(filters.language ? { languages: { has: filters.language } } : {}),
    },
    select: {
      id: true,
      displayName: true,
      serviceTypes: true,
      serviceRegions: true,
      languages: true,
      verificationStatus: true,
      profileSummary: true,
    },
    take: 50,
  });
}
