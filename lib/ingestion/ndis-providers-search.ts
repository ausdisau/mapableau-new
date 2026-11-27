import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  PROVIDER_SERVICE_CATALOG,
  resolveProviderServiceCatalog,
} from "@/lib/provider/finder/search-service-catalog";

export type NdisProviderSearchParams = {
  /** Full-text match against provider_name only. Never concatenate suburb or service. */
  q?: string;
  state?: string;
  postcode?: string;
  suburb?: string;
  /** Free-text service; resolved to catalog overlap when possible. */
  service?: string;
  registrationGroups?: string[];
  serviceLabels?: string[];
  limit?: number;
  /** When true, only rows with non-null, non-zero latitude/longitude (map pins). */
  withCoordinatesOnly?: boolean;
};

export type NdisProviderSearchRow = {
  source_id: string;
  provider_name: string;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  services: string[];
  registration_groups: string[];
  updated_at: Date;
};

function likeLiteral(text: string): string {
  return `%${text.replace(/[\\%_]/g, "\\$&")}%`;
}

function resolveServiceOverlap(params: NdisProviderSearchParams): {
  registrationGroups: string[];
  serviceLabels: string[];
  fallbackLike?: string;
} {
  const registrationGroups = (params.registrationGroups ?? []).filter(Boolean);
  const serviceLabels = (params.serviceLabels ?? []).filter(Boolean);
  if (registrationGroups.length > 0 || serviceLabels.length > 0) {
    return { registrationGroups, serviceLabels };
  }

  const service = params.service?.trim();
  if (!service) return { registrationGroups: [], serviceLabels: [] };

  const catalogId = resolveProviderServiceCatalog(service);
  if (catalogId) {
    const entry = PROVIDER_SERVICE_CATALOG[catalogId];
    return {
      registrationGroups: entry.registrationGroups,
      serviceLabels: entry.serviceLabels,
    };
  }

  return {
    registrationGroups: [],
    serviceLabels: [],
    fallbackLike: service,
  };
}

export async function searchNdisProviders(
  params: NdisProviderSearchParams,
): Promise<{ providers: NdisProviderSearchRow[]; count: number }> {
  const limit = Math.min(Math.max(params.limit ?? 25, 1), 100);
  const q = params.q?.trim() || null;
  const state = params.state?.trim().toUpperCase() || null;
  const postcode = params.postcode?.trim() || null;
  const suburb = params.suburb?.trim() || null;
  const overlap = resolveServiceOverlap(params);

  const conditions: Prisma.Sql[] = [Prisma.sql`TRUE`];

  if (params.withCoordinatesOnly) {
    conditions.push(
      Prisma.sql`latitude IS NOT NULL`,
      Prisma.sql`longitude IS NOT NULL`,
      Prisma.sql`latitude <> 0`,
      Prisma.sql`longitude <> 0`,
    );
  }

  if (q) {
    conditions.push(
      Prisma.sql`to_tsvector('english', provider_name) @@ plainto_tsquery('english', ${q})`,
    );
  }
  if (state) {
    conditions.push(Prisma.sql`state = ${state}`);
  }
  if (postcode) {
    conditions.push(Prisma.sql`postcode = ${postcode}`);
  }
  if (suburb) {
    conditions.push(Prisma.sql`suburb ILIKE ${likeLiteral(suburb)}`);
  }

  const serviceSources: Prisma.Sql[] = [];
  if (overlap.registrationGroups.length > 0) {
    serviceSources.push(
      Prisma.sql`registration_groups && ARRAY[${Prisma.join(overlap.registrationGroups)}]::text[]`,
    );
  }
  if (overlap.serviceLabels.length > 0) {
    serviceSources.push(
      Prisma.sql`services && ARRAY[${Prisma.join(overlap.serviceLabels)}]::text[]`,
    );
  }
  if (overlap.fallbackLike) {
    const like = likeLiteral(overlap.fallbackLike);
    serviceSources.push(
      Prisma.sql`EXISTS (SELECT 1 FROM unnest(services) AS s WHERE s ILIKE ${like})`,
    );
    serviceSources.push(
      Prisma.sql`EXISTS (SELECT 1 FROM unnest(registration_groups) AS g WHERE g ILIKE ${like})`,
    );
  }
  if (serviceSources.length > 0) {
    conditions.push(Prisma.sql`(${Prisma.join(serviceSources, " OR ")})`);
  }

  const whereClause = Prisma.join(conditions, " AND ");

  const rows = await prisma.$queryRaw<NdisProviderSearchRow[]>`
    SELECT
      source_id,
      provider_name,
      suburb,
      state,
      postcode,
      latitude,
      longitude,
      phone,
      email,
      website,
      services,
      registration_groups,
      updated_at
    FROM ndis_providers
    WHERE ${whereClause}
    ORDER BY provider_name ASC
    LIMIT ${limit}
  `;

  return { providers: rows, count: rows.length };
}
