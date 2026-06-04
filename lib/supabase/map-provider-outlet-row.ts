import type { ProviderOutlet } from "@/data/provider-outlets.types";

import { mapOutletToProvider } from "@/app/provider-finder/outletToProvider";

/** Row shape for `public.provider_outlets` (Supabase / Postgres). */
export type ProviderOutletDbRow = {
  id: string;
  abn: string;
  name: string;
  slug: string | null;
  outlet_key: string | null;
  outlet_name: string | null;
  flag: string | null;
  active: boolean;
  phone: string | null;
  website: string | null;
  email: string | null;
  address: string | null;
  head_office: string | null;
  state: string;
  postcode: string | null;
  latitude: number | null;
  longitude: number | null;
  reg_group: number[];
  opening_hours: string | null;
  professions: string | null;
  raw: Record<string, unknown>;
};

export function mapProviderOutletToDbRow(
  outlet: ProviderOutlet,
  index: number,
): ProviderOutletDbRow {
  const mapped = mapOutletToProvider(outlet, index);
  const name = (outlet.Prov_N?.trim() || outlet.Outletname?.trim() || "Unknown").trim();

  return {
    id: mapped.id,
    abn: outlet.ABN?.trim() || "",
    name,
    slug: mapped.slug || null,
    outlet_key: mapped.outletKey ?? null,
    outlet_name: outlet.Outletname?.trim() || null,
    flag: outlet.Flag ?? null,
    active: outlet.Active === 1,
    phone: outlet.Phone?.trim() || null,
    website: outlet.Website?.trim() || null,
    email: outlet.Email?.trim() || null,
    address: outlet.Address?.trim() || null,
    head_office: outlet.Head_Office?.trim() || null,
    state: mapped.state || outlet.State_cd,
    postcode: mapped.postcode || String(outlet.Post_cd) || null,
    latitude: outlet.Latitude !== 0 ? outlet.Latitude : null,
    longitude: outlet.Longitude !== 0 ? outlet.Longitude : null,
    reg_group: Array.isArray(outlet.RegGroup) ? outlet.RegGroup : [],
    opening_hours: outlet.opnhrs?.trim() || null,
    professions: outlet.prfsn?.trim() || null,
    raw: outlet as unknown as Record<string, unknown>,
  };
}
