import { Prisma } from "@prisma/client";

import type { NdisProviderSearchRow } from "@/lib/ingestion/ndis-providers-search";
import { prisma } from "@/lib/prisma";

import {
  PROVIDER_SERVICE_CATALOG,
  PROVIDER_SERVICE_IDS,
  type ProviderServiceId,
} from "./search-service-catalog";
import type { ProviderSearchPreferences } from "./search-profile-contract";

const STATE_NAMES: Record<string, string> = {
  NSW: "New South Wales", VIC: "Victoria", QLD: "Queensland",
  SA: "South Australia", WA: "Western Australia", TAS: "Tasmania",
  ACT: "Australian Capital Territory", NT: "Northern Territory",
};

export type ProviderChatIntent = {
  state?: string;
  postcode?: string;
  suburb?: string;
  serviceType?: ProviderServiceId;
  providerName?: string;
  workerIntent: boolean;
};

export function parseProviderChatIntent(text: string): ProviderChatIntent {
  const input = text.trim().slice(0, 500);
  const lower = input.toLowerCase();
  const postcode = input.match(/\b\d{4}\b/)?.[0];
  const state = Object.keys(STATE_NAMES).find(
    (code) => new RegExp("\\b" + code + "\\b", "i").test(input) ||
      lower.includes(STATE_NAMES[code].toLowerCase()),
  );

  const serviceType = PROVIDER_SERVICE_IDS.find((id) =>
    PROVIDER_SERVICE_CATALOG[id].phrases.some((phrase) => lower.includes(phrase)),
  );

  const location = input.match(
    /\b(?:near|around|in)\s+([a-z][a-z'’\-]*(?:\s+[a-z][a-z'’\-]*){0,2})(?=\s*(?:,|$|\b(?:for|with|who|that|and|to|providing|offering)\b))/i,
  )?.[1]?.trim();

  const cleanLocation = location?.replace(
    new RegExp("\\s+(?:" + Object.keys(STATE_NAMES).join("|") + ")$", "i"), "",
  ).trim();
  const suburb = cleanLocation && !/^(me|my area|my suburb|australia)$/i.test(cleanLocation) &&
    !Object.keys(STATE_NAMES).some((code) =>
      cleanLocation.toUpperCase() === code || cleanLocation.toLowerCase() === STATE_NAMES[code].toLowerCase(),
    )
    ? cleanLocation : undefined;
  const providerName = input.match(/\b(?:provider named|provider called|organisation named|organisation called)\s+([a-z0-9 .'\-]{3,60})$/i)?.[1]?.trim();

  return {
    postcode,
    state,
    suburb,
    serviceType,
    providerName,
    workerIntent: /\b(?:worker|workers|carer|carers|screening|clearance)\b/i.test(input),
  };
}

export type ProviderSearchFilters = {
  state?: string;
  postcode?: string;
  suburb?: string;
  serviceTypes: ProviderServiceId[];
  providerName?: string;
  communicationModes: string[];
  functionalRequirements: ProviderSearchPreferences["functionalRequirements"];
  delivery: ProviderSearchPreferences["delivery"];
  fundingManagement: ProviderSearchPreferences["fundingManagement"];
  usedSavedProfile: boolean;
};

export function buildProviderSearchFilters(input: {
  intent: ProviderChatIntent;
  saved?: ProviderSearchPreferences | null;
  transient?: {
    state?: string; postcode?: string;
    serviceType?: ProviderServiceId; communication?: string;
  };
  usedSavedProfile: boolean;
}): ProviderSearchFilters {
  const { intent, transient, saved } = input;
  // Never combine an explicit location with conflicting stored or temporary geography.
  const explicitLocation = Boolean(intent.state || intent.postcode || intent.suburb);
  const transientLocation = Boolean(transient?.state || transient?.postcode);
  const state = explicitLocation ? intent.state
    : transientLocation ? transient?.state : saved?.state;
  const postcode = explicitLocation ? intent.postcode
    : transientLocation ? transient?.postcode : saved?.postcode;
  const suburb = explicitLocation ? intent.suburb
    : transientLocation ? undefined : saved?.suburb;
  const serviceTypes = intent.serviceType ? [intent.serviceType] :
    transient?.serviceType ? [transient.serviceType] : saved?.serviceTypes ?? [];
  return {
    state, postcode, suburb, serviceTypes, providerName: intent.providerName,
    communicationModes: transient?.communication ? [transient.communication] : saved?.communicationModes ?? [],
    functionalRequirements: saved?.functionalRequirements ?? [],
    delivery: saved?.delivery ?? "any",
    fundingManagement: saved?.fundingManagement ?? "unspecified",
    usedSavedProfile: input.usedSavedProfile,
  };
}

function likeLiteral(text: string) {
  return "%" + text.replace(/[\\%_]/g, "\\$&") + "%";
}

export async function lookupMatchingProviderRecords(
  filters: ProviderSearchFilters,
  take = 12,
): Promise<{ results: NdisProviderSearchRow[]; hasMore: boolean }> {
  if (!filters.state && !filters.postcode && !filters.suburb &&
      !filters.providerName && filters.serviceTypes.length === 0) {
    return { results: [], hasMore: false };
  }

  const clauses: Prisma.Sql[] = [Prisma.sql`TRUE`];
  if (filters.state) clauses.push(Prisma.sql`state = ${filters.state}`);
  if (filters.postcode) clauses.push(Prisma.sql`postcode = ${filters.postcode}`);
  if (filters.suburb) clauses.push(Prisma.sql`suburb ILIKE ${likeLiteral(filters.suburb)}`);
  if (filters.providerName) clauses.push(Prisma.sql`provider_name ILIKE ${likeLiteral(filters.providerName)}`);

  if (filters.serviceTypes.length) {
    const predicates = filters.serviceTypes.map((id) => {
      const { registrationGroups, serviceLabels } = PROVIDER_SERVICE_CATALOG[id];
      const sources: Prisma.Sql[] = [];
      if (registrationGroups.length) {
        sources.push(Prisma.sql`registration_groups && ARRAY[${Prisma.join(registrationGroups)}]::text[]`);
      }
      if (serviceLabels.length) {
        sources.push(Prisma.sql`services && ARRAY[${Prisma.join(serviceLabels)}]::text[]`);
      }
      return Prisma.sql`(${Prisma.join(sources, " OR ")})`;
    });
    clauses.push(Prisma.sql`(${Prisma.join(predicates, " OR ")})`);
  }

  const limit = Math.min(Math.max(take, 1), 25);
  const rows = await prisma.$queryRaw<NdisProviderSearchRow[]>`
    SELECT source_id, provider_name, suburb, state, postcode,
           latitude, longitude, phone, email, website,
           services, registration_groups, updated_at
    FROM ndis_providers
    WHERE ${Prisma.join(clauses, " AND ")}
    ORDER BY provider_name ASC, source_id ASC
    LIMIT ${limit + 1}
  `;
  return { results: rows.slice(0, limit), hasMore: rows.length > limit };
}
