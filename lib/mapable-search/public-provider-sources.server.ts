import "server-only";

import { createClient } from "@supabase/supabase-js";

import { prisma } from "@/lib/prisma";

import type {
  DirectoryVariables,
  PublicDirectoryProvider,
  PublicDirectorySource,
} from "./federated-public-directory";

/**
 * Prisma's existing Provider/ServiceLocation models map to the observed
 * MapAble Neon tables. Only SELECT-style model operations and public display
 * fields are used. A deployment still needs a least-privileged read-only DB
 * role and verification that its DATABASE_URL targets the intended project.
 */
export const mapAbleNeonPublicProviders: PublicDirectorySource = {
  name: "neon",
  async search(input: DirectoryVariables): Promise<PublicDirectoryProvider[]> {
    const records = await prisma.provider.findMany({
      where: {
        name: { contains: input.text, mode: "insensitive" },
        ...(input.state
          ? { locations: { some: { state: input.state } } }
          : {}),
      },
      select: {
        id: true,
        name: true,
        locations: {
          select: { city: true, state: true },
          orderBy: { id: "asc" },
          take: 1,
        },
      },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      take: input.limit,
    });
    return records.map((row) => ({
      id: row.id,
      name: row.name,
      state: row.locations[0]?.state ?? null,
      locality: row.locations[0]?.city ?? null,
      source: "neon" as const,
      evidenceStatus: "imported_or_self_described" as const,
      registrationStatus: "not_currently_verified" as const,
      availability: "unknown" as const,
    }));
  },
};

/** Preserve literal substring intent in Supabase's ilike expression. */
function escapeLikeSearch(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

/**
 * This is a *public RLS-scoped* client, not getSupabaseAdmin().
 *
 * The historical checked-in migration provides an active-outlets-only SELECT
 * policy. Whether that migration is deployed is UNKNOWN because the connected
 * MapAble Supabase project is inactive. Do not enable this source until RLS,
 * grants, actual table shape and freshness have been independently verified.
 */
export const mapAbleSupabasePublicOutlets: PublicDirectorySource = {
  name: "supabase",
  async search(input: DirectoryVariables): Promise<PublicDirectoryProvider[]> {
    const url = process.env.SUPABASE_URL?.trim();
    const publishable = process.env.SUPABASE_PUBLISHABLE_KEY?.trim()
      || process.env.SUPABASE_ANON_KEY?.trim();
    if (!url || !publishable) throw new Error("SUPABASE_PUBLIC_SOURCE_NOT_CONFIGURED");

    const supabase = createClient(url, publishable, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { "X-Client-Info": "mapable-public-search-readonly" } },
    });
    let query = supabase
      .from("provider_outlets")
      .select("id,name,state,postcode")
      .eq("active", true)
      .ilike("name", `%${escapeLikeSearch(input.text)}%`)
      .order("name", { ascending: true })
      .limit(input.limit);
    if (input.state) query = query.eq("state", input.state);
    const { data, error } = await query;
    if (error) throw new Error("SUPABASE_PUBLIC_DIRECTORY_UNAVAILABLE");
    return (data ?? []).flatMap((row) => {
      if (typeof row.id !== "string" || typeof row.name !== "string") return [];
      return [{
        id: row.id,
        name: row.name,
        state: typeof row.state === "string" ? row.state : null,
        locality: typeof row.postcode === "string" ? row.postcode : null,
        source: "supabase" as const,
        evidenceStatus: "imported_or_self_described" as const,
        registrationStatus: "not_currently_verified" as const,
        availability: "unknown" as const,
      }];
    });
  },
};
