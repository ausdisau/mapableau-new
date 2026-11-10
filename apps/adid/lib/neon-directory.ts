import { neon } from "@neondatabase/serverless";

import { adidFlags } from "./feature-flags.ts";
import { verifiedPublicHref } from "./service-directory.ts";

export type DirectoryResult = {
  status: "disabled" | "unavailable" | "ready";
  entries: { id: string; name: string; href: string | null }[];
};

/**
 * Never read neon_auth users, sessions, passwords, or application member tables.
 * Only optional public.services when explicitly enabled.
 */
export async function getReadOnlyServiceDirectory(): Promise<DirectoryResult> {
  if (!adidFlags.directoryEnabled() || !adidFlags.neonDirectoryEnabled()) {
    return { status: "disabled", entries: [] };
  }
  if (!process.env.DATABASE_URL) {
    return { status: "unavailable", entries: [] };
  }
  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      SELECT id, name, url
      FROM public.services
      WHERE is_active = true
      ORDER BY name ASC
      LIMIT 40
    `;
    const entries: DirectoryResult["entries"] = [];
    for (const x of rows) {
      if (typeof x.id === "string" && typeof x.name === "string") {
        entries.push({
          id: x.id,
          name: x.name.slice(0, 160),
          href: verifiedPublicHref(x.url),
        });
      }
    }
    return { status: "ready", entries };
  } catch {
    return { status: "unavailable", entries: [] };
  }
}
