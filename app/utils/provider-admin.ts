import type { ProviderRole } from "@prisma/client";

import { ensureProviderOrganisation } from "@/lib/providers/ensure-provider-organisation";
import { prisma } from "@/lib/prisma";
import {
  GetAdminResponse,
  GetCatalogResponse,
} from "@/schemas/provider-admin.types";

import { auth } from "../lib/auth";

export function canEditOrganization(role: ProviderRole) {
  return role === "ADMIN" || role === "MANAGER";
}

export function canEditWorkerProfile(params: {
  role: ProviderRole;
  sessionUserId: string;
  workerUserId: string;
}) {
  if (canEditOrganization(params.role)) return true;
  return (
    params.role === "STAFF" && params.sessionUserId === params.workerUserId
  );
}

export async function getSessionUserId() {
  const user = await auth();
  return user?.id ?? null;
}

export async function getProviderMembership(
  userId: string,
  providerId: string,
) {
  return prisma.providerUserRole.findUnique({
    where: { userId_providerId: { userId, providerId } },
    include: { provider: { select: { id: true, name: true } } },
  });
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidProviderId(id: string) {
  return UUID_RE.test(id);
}

export async function getProviderWithWorkers(providerId: string) {
  const organisationId = await ensureProviderOrganisation(providerId);
  if (!organisationId) return null;

  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
  });
  if (!provider) return null;

  const workerProfiles = await prisma.workerProfile.findMany({
    where: { organisationId, active: true },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { displayName: "asc" },
  });

  return {
    provider,
    organisationId,
    workerProfiles,
  };
}

export const getAdminResponse = (
  membership: NonNullable<Awaited<ReturnType<typeof getProviderMembership>>>,
  data: NonNullable<Awaited<ReturnType<typeof getProviderWithWorkers>>>,
): GetAdminResponse => {
  const { provider, workerProfiles } = data;
  return {
    role: membership.role,
    canEditOrganization: canEditOrganization(membership.role),
    provider: {
      id: provider.id,
      name: provider.name,
      logoUrl: provider.logoUrl,
      description: provider.description,
      website: provider.website,
      email: provider.email,
      phone: provider.phone,
      abn: provider.abn,
      businessType: provider.businessType,
      ndisRegistered: provider.ndisRegistered,
      ndisNumber: provider.ndisNumber,
      serviceAreas: provider.serviceAreas,
      specialisations: provider.specialisations,
    },
    workers: workerProfiles.map((wp) => ({
      id: wp.id,
      userId: wp.userId ?? "",
      name: wp.user?.name ?? wp.displayName,
      email: wp.user?.email ?? null,
      bio: wp.profileSummary,
      qualifications: wp.qualificationsSummary,
      languages: wp.languages.map((name) => ({ id: name, name })),
      specialisations: wp.specialisations.map((name) => ({
        id: name,
        name,
      })),
    })),
  };
};

export const getAdminCatalog = async (): Promise<GetCatalogResponse> => {
  const [languages, specialisations] = await Promise.all([
    prisma.language.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.specialisation.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  return {
    languages,
    specialisations,
  };
};
