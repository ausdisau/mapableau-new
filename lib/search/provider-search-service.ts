import { prisma } from "@/lib/prisma";
import {
  type WorkerMarketplaceCandidate,
  type WorkerSearchFilters,
} from "@/lib/search/worker-search-types";

export type ProviderSearchFilters = WorkerSearchFilters;

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

  return orgs.map((o) => ({
    id: o.id,
    name: o.name,
    organisationType: o.organisationType,
    verificationStatus: o.verificationStatus,
    verificationCaution:
      o.verificationStatus !== "verified"
        ? "This provider is not fully verified. Details require review."
        : null,
    serviceRegions: o.serviceRegions,
    // Never expose private credential documents
  }));
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
      ...(filters.query
        ? {
            OR: [
              { displayName: { contains: filters.query, mode: "insensitive" } },
              {
                profileSummary: {
                  contains: filters.query,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
      ...(filters.serviceType
        ? { serviceTypes: { has: filters.serviceType } }
        : {}),
      ...(filters.language ? { languages: { has: filters.language } } : {}),
      ...(filters.serviceRegion
        ? { serviceRegions: { has: filters.serviceRegion } }
        : {}),
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

export async function searchProvidersPublic(filters: ProviderSearchFilters) {
  return prisma.organisation.findMany({
    where: {
      status: "active",
      organisationType: {
        in: ["care_provider", "support_coordination"],
      },
      ...(filters.query
        ? { name: { contains: filters.query, mode: "insensitive" } }
        : {}),
      ...(filters.verificationStatus
        ? { verificationStatus: filters.verificationStatus as never }
        : {}),
      ...(filters.serviceRegion
        ? { serviceRegions: { has: filters.serviceRegion } }
        : {}),
    },
    select: {
      id: true,
      name: true,
      organisationType: true,
      serviceRegions: true,
      verificationStatus: true,
      notes: true,
    },
    take: 50,
    orderBy: { name: "asc" },
  });
}

export async function searchWorkerMarketplaceCandidates(
  filters: ProviderSearchFilters,
): Promise<WorkerMarketplaceCandidate[]> {
  const [workers, providers] = await Promise.all([
    searchWorkersPublic(filters),
    searchProvidersPublic(filters),
  ]);

  const workerCandidates: WorkerMarketplaceCandidate[] = workers.map((worker) => ({
    id: worker.id,
    kind: "worker",
    displayName: worker.displayName,
    serviceTypes: worker.serviceTypes,
    serviceRegions: worker.serviceRegions,
    languages: worker.languages,
    verificationStatus: worker.verificationStatus,
    summary: worker.profileSummary,
  }));

  const providerCandidates: WorkerMarketplaceCandidate[] = providers.map((provider) => ({
    id: provider.id,
    kind: "provider",
    displayName: provider.name,
    serviceTypes: provider.organisationType ? [provider.organisationType] : [],
    serviceRegions: provider.serviceRegions,
    languages: [],
    verificationStatus: provider.verificationStatus,
    summary: provider.notes,
  }));

  return [...workerCandidates, ...providerCandidates];
}
