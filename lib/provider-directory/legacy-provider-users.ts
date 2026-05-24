import type { Provider } from "@/app/provider-finder/providers";
import { prisma } from "@/lib/prisma";

const AU_STATES = new Set([
  "NSW",
  "VIC",
  "QLD",
  "SA",
  "WA",
  "TAS",
  "ACT",
  "NT",
]);

type LegacyProviderUser = {
  id: string;
  full_name: string | null;
  email: string | null;
  provider_business_name: string | null;
  provider_abn: string | null;
  provider_registration_groups: string[] | null;
  location: string | null;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function parseLocation(location: string | null): {
  suburb: string;
  state: Provider["state"];
} {
  if (!location?.trim()) return { suburb: "—", state: "NSW" };
  const parts = location.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const statePart = parts[parts.length - 1].toUpperCase();
    const state = AU_STATES.has(statePart)
      ? (statePart as Provider["state"])
      : "NSW";
    return { suburb: parts[parts.length - 2] || parts[0], state };
  }
  return { suburb: location, state: "NSW" };
}

export function mapLegacyUserToFinder(u: LegacyProviderUser): Provider {
  const name =
    u.provider_business_name?.trim() || u.full_name?.trim() || "Provider";
  const { suburb, state } = parseLocation(u.location);
  const categories = Array.isArray(u.provider_registration_groups)
    ? u.provider_registration_groups.filter(Boolean)
    : [];

  return {
    id: `legacy-user-${u.id}`,
    slug: slugify(name) || `legacy-${u.id}`,
    name,
    suburb,
    state,
    postcode: "",
    distanceKm: 0,
    rating: 0,
    reviewCount: 0,
    registered: Boolean(u.provider_abn),
    categories: categories.length > 0 ? categories : ["Support services"],
    supports: ["In-person", "Telehealth"],
    email: u.email ?? undefined,
    abn: u.provider_abn ?? undefined,
  };
}

export async function fetchLegacyProviderUsers(): Promise<Provider[]> {
  const rows = await prisma.$queryRaw<LegacyProviderUser[]>`
    SELECT
      id,
      full_name,
      email,
      provider_business_name,
      provider_abn,
      provider_registration_groups,
      location
    FROM users
    WHERE role::text = 'provider'
       OR provider_business_name IS NOT NULL
       OR provider_abn IS NOT NULL
  `;

  return rows.map(mapLegacyUserToFinder);
}
