import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { mapOutletsToProviders } from "@/app/provider-finder/outletToProvider";
import type { Provider } from "@/app/provider-finder/providers";
import type { ProviderOutlet } from "@/data/provider-outlets.types";
import { prisma } from "@/lib/prisma";
import { fetchLegacyProviderUsers } from "@/lib/provider-directory/legacy-provider-users";
import { mapDbProviderToFinder } from "@/lib/provider-directory/map-db-provider";

export type ProviderDirectoryMeta = {
  sources: {
    database: number;
    legacyUsers: number;
    outletsJson: number;
  };
};

async function loadOutletJson(): Promise<Provider[]> {
  const path = join(process.cwd(), "public", "data", "provider-outlets.json");
  const raw = await readFile(path, "utf8");
  const parsed = JSON.parse(raw) as { data?: ProviderOutlet[] };
  const outlets = Array.isArray(parsed.data) ? parsed.data : [];
  return mapOutletsToProviders(outlets);
}

function mergeProviders(lists: Provider[][]): Provider[] {
  const byKey = new Map<string, Provider>();

  for (const list of lists) {
    for (const p of list) {
      const key =
        p.outletKey?.toLowerCase() ||
        (p.abn ? `abn:${p.abn}` : "") ||
        p.slug?.toLowerCase() ||
        p.id;
      if (!byKey.has(key)) byKey.set(key, p);
    }
  }

  return Array.from(byKey.values());
}

export async function fetchProviderDirectory(): Promise<{
  providers: Provider[];
  meta: ProviderDirectoryMeta;
}> {
  const lists: Provider[][] = [];
  let databaseCount = 0;
  let legacyUsersCount = 0;

  try {
    const dbProviders = await prisma.provider.findMany({
      include: { locations: true },
      orderBy: { name: "asc" },
    });
    if (dbProviders.length > 0) {
      databaseCount = dbProviders.length;
      lists.push(dbProviders.map(mapDbProviderToFinder));
    }
  } catch {
    // Provider table may not exist yet — fall through to other sources.
  }

  try {
    const legacy = await fetchLegacyProviderUsers();
    if (legacy.length > 0) {
      legacyUsersCount = legacy.length;
      lists.push(legacy);
    }
  } catch {
    // Legacy users schema unavailable.
  }

  const jsonProviders = await loadOutletJson();
  lists.push(jsonProviders);

  const providers = mergeProviders(lists);

  return {
    providers,
    meta: {
      sources: {
        database: databaseCount,
        legacyUsers: legacyUsersCount,
        outletsJson: jsonProviders.length,
      },
    },
  };
}
