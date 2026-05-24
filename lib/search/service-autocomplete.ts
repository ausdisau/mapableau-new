import { prisma } from "@/lib/prisma";
import type { AutocompleteSuggestion } from "@/types/search";


export async function searchServiceCategories(
  query: string,
  limit: number,
): Promise<AutocompleteSuggestion[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const rows = await prisma.serviceCategory.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { keywords: { hasSome: [q] } },
      ],
    },
    take: limit,
    orderBy: { name: "asc" },
  });

  return rows.map((row) => ({
    id: `service-${row.id}`,
    type: "service",
    typeLabel: "Service",
    label: row.name,
    value: row.name,
  }));
}

export async function searchAccessibilityFeatures(
  query: string,
  limit: number,
): Promise<AutocompleteSuggestion[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const rows = await prisma.searchAccessibilityFeature.findMany({
    where: {
      OR: [
        { label: { contains: q, mode: "insensitive" } },
        { keywords: { hasSome: [q] } },
      ],
    },
    take: limit,
    orderBy: { label: "asc" },
  });

  return rows.map((row) => ({
    id: `access-${row.id}`,
    type: "accessibility_feature",
    typeLabel: "Access",
    label: row.label,
    value: row.label,
  }));
}

export async function searchLanguages(
  query: string,
  limit: number,
): Promise<AutocompleteSuggestion[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const rows = await prisma.searchLanguage.findMany({
    where: {
      OR: [
        { label: { contains: q, mode: "insensitive" } },
        { keywords: { hasSome: [q] } },
      ],
    },
    take: limit,
    orderBy: { label: "asc" },
  });

  return rows.map((row) => ({
    id: `language-${row.id}`,
    type: "language",
    typeLabel: "Language",
    label: row.label,
    value: row.label,
  }));
}

export async function searchPopularSearches(
  query: string,
  context: "homepage" | "provider_finder",
  limit: number,
): Promise<AutocompleteSuggestion[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const rows = await prisma.popularSearch.findMany({
    where: {
      query: { contains: q, mode: "insensitive" },
      OR: [{ context: "all" }, { context }],
    },
    take: limit,
    orderBy: [{ weight: "desc" }, { query: "asc" }],
  });

  return rows.map((row) => ({
    id: `popular-${row.id}`,
    type: "popular_search",
    typeLabel: "Popular",
    label: row.query,
    value: row.query,
  }));
}
