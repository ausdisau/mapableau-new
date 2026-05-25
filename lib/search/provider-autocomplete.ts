import { prisma } from "@/lib/prisma";
import type { AutocompleteSuggestion } from "@/types/search";


/** Only directory profiles explicitly marked visible; verified preferred in sort. */
export async function searchProviders(
  query: string,
  limit: number,
): Promise<AutocompleteSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
  const rows = await prisma.providerProfile.findMany({
    where: {
      isSearchVisible: true,
      isVerified: true,
      name: { contains: q, mode: "insensitive" },
    },
    take: limit,
    orderBy: [{ name: "asc" }],
  });

  return rows.map((row) => ({
    id: `provider-${row.id}`,
    type: "provider",
    typeLabel: "Provider",
    label: row.name,
    description: [row.suburb, row.state].filter(Boolean).join(", ") || undefined,
    value: row.name,
    metadata: {
      slug: row.slug ?? undefined,
      suburb: row.suburb ?? undefined,
      state: row.state ?? undefined,
      postcode: row.postcode ?? undefined,
      providerId: row.legacyProviderId ?? undefined,
    },
  }));
  } catch {
    return [];
  }
}
