import { prisma } from "@/lib/prisma";
import { keywordsMatchQuery, textMatchesQuery } from "@/lib/search/matches-query";
import type { AutocompleteSuggestion } from "@/types/search";

function filterByQuery<T extends { keywords: string[] }>(
  rows: T[],
  query: string,
  getSearchableText: (row: T) => string,
  limit: number,
): T[] {
  const q = query.trim();
  if (q.length < 2) return [];
  return rows
    .filter(
      (row) =>
        textMatchesQuery(getSearchableText(row), q) ||
        keywordsMatchQuery(row.keywords, q),
    )
    .slice(0, limit);
}

export async function searchServiceCategories(
  query: string,
  limit: number,
): Promise<AutocompleteSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    const rows = await prisma.serviceCategory.findMany({
      where: {
        name: { contains: q, mode: "insensitive" },
      },
      take: limit,
      orderBy: { name: "asc" },
    });

    let matched = rows;
    if (matched.length < limit) {
      const extra = await prisma.serviceCategory.findMany({
        take: 80,
        orderBy: { name: "asc" },
      });
      const seen = new Set(matched.map((r) => r.id));
      for (const row of filterByQuery(extra, q, (r) => r.name, limit)) {
        if (seen.has(row.id)) continue;
        seen.add(row.id);
        matched.push(row);
        if (matched.length >= limit) break;
      }
    }

    return matched.slice(0, limit).map((row) => ({
      id: `service-${row.id}`,
      type: "service",
      typeLabel: "Service",
      label: row.name,
      value: row.name,
    }));
  } catch {
    return [];
  }
}

export async function searchAccessibilityFeatures(
  query: string,
  limit: number,
): Promise<AutocompleteSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    const rows = await prisma.searchAccessibilityFeature.findMany({
      where: {
        label: { contains: q, mode: "insensitive" },
      },
      take: limit,
      orderBy: { label: "asc" },
    });

    let matched = rows;
    if (matched.length < limit) {
      const extra = await prisma.searchAccessibilityFeature.findMany({
        take: 80,
        orderBy: { label: "asc" },
      });
      const seen = new Set(matched.map((r) => r.id));
      for (const row of filterByQuery(extra, q, (r) => r.label, limit)) {
        if (seen.has(row.id)) continue;
        seen.add(row.id);
        matched.push(row);
        if (matched.length >= limit) break;
      }
    }

    return matched.slice(0, limit).map((row) => ({
      id: `access-${row.id}`,
      type: "accessibility_feature",
      typeLabel: "Access",
      label: row.label,
      value: row.label,
    }));
  } catch {
    return [];
  }
}

export async function searchLanguages(
  query: string,
  limit: number,
): Promise<AutocompleteSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    const rows = await prisma.searchLanguage.findMany({
      where: {
        label: { contains: q, mode: "insensitive" },
      },
      take: limit,
      orderBy: { label: "asc" },
    });

    let matched = rows;
    if (matched.length < limit) {
      const extra = await prisma.searchLanguage.findMany({
        take: 40,
        orderBy: { label: "asc" },
      });
      const seen = new Set(matched.map((r) => r.id));
      for (const row of filterByQuery(extra, q, (r) => r.label, limit)) {
        if (seen.has(row.id)) continue;
        seen.add(row.id);
        matched.push(row);
        if (matched.length >= limit) break;
      }
    }

    return matched.slice(0, limit).map((row) => ({
      id: `language-${row.id}`,
      type: "language",
      typeLabel: "Language",
      label: row.label,
      value: row.label,
    }));
  } catch {
    return [];
  }
}

export async function searchPopularSearches(
  query: string,
  context: "homepage" | "provider_finder",
  limit: number,
): Promise<AutocompleteSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
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
  } catch {
    return [];
  }
}
