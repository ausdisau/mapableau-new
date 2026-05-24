import type { ProviderOutlet } from "@/data/provider-outlets.types";
import { regGroupIndicesToCategories } from "@/app/provider-finder/regGroupOptions";

import type { AggregatedNdisProvider } from "./types";
import {
  normalizeAbn,
  parseHeadOffice,
  parseOutletAddress,
} from "./parse-location";

const MAX_LOCATIONS_PER_PROVIDER = 50;
const MAX_SPECIALISATIONS = 40;
const MAX_SERVICES = 25;

function mergeUnique(target: string[], items: string[], max: number) {
  for (const item of items) {
    const v = item.trim();
    if (!v || target.includes(v)) continue;
    target.push(v);
    if (target.length >= max) return;
  }
}

type LocationRow = AggregatedNdisProvider["locations"][0] & { key: string };

function outletLocationRow(o: ProviderOutlet): LocationRow | null {
  const parsed =
    parseOutletAddress(o.Address) ?? parseHeadOffice(o.Head_Office);
  const address =
    o.Address?.trim() && o.Address.toUpperCase() !== "CONFIDENTIAL"
      ? o.Address.trim()
      : o.Head_Office?.trim() || "";
  if (!address) return null;

  const state = parsed.state || o.State_cd || undefined;
  const postcode = parsed.postcode || (o.Post_cd ? String(o.Post_cd) : undefined);
  const city = parsed.suburb || undefined;

  return {
    address,
    city,
    state,
    postcode,
    country: "Australia",
    key: `${address}|${state}|${postcode}`,
  };
}

export function aggregateOutletsByAbn(
  outlets: ProviderOutlet[]
): AggregatedNdisProvider[] {
  const byAbn = new Map<string, AggregatedNdisProvider & { locationKeys: Set<string> }>();

  for (const o of outlets) {
    const abn = normalizeAbn(o.ABN ?? "");
    if (!abn || abn.length < 9) continue;

    const name = (o.Prov_N?.trim() || o.Outletname?.trim() || "").trim();
    if (!name) continue;

    let row = byAbn.get(abn);
    if (!row) {
      row = {
        abn,
        name,
        ndisRegistered: o.Active === 1,
        serviceAreas: [],
        specialisations: [],
        locations: [],
        locationKeys: new Set(),
        services: [],
      };
      byAbn.set(abn, row);
    }

    if (o.Active === 1) row.ndisRegistered = true;
    if (!row.email && o.Email?.trim()) row.email = o.Email.trim();
    if (!row.phone && o.Phone?.trim()) row.phone = o.Phone.trim();
    if (!row.website && o.Website?.trim()) row.website = o.Website.trim();

    const area = [o.State_cd, o.Post_cd ? String(o.Post_cd) : ""]
      .filter(Boolean)
      .join(" ");
    if (area) mergeUnique(row.serviceAreas, [area], 30);

    const regCats = regGroupIndicesToCategories(o.RegGroup ?? []);
    const prfsn = (o.prfsn ?? "")
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
    mergeUnique(row.specialisations, regCats.length ? regCats : prfsn, MAX_SPECIALISATIONS);

    const loc = outletLocationRow(o);
    if (loc && row.locationKeys.size < MAX_LOCATIONS_PER_PROVIDER) {
      const { key, ...rest } = loc;
      if (!row.locationKeys.has(key)) {
        row.locationKeys.add(key);
        row.locations.push(rest);
      }
    }
  }

  const result: AggregatedNdisProvider[] = [];
  for (const row of byAbn.values()) {
    const services = row.specialisations.slice(0, MAX_SERVICES).map((name) => ({
      name,
      description: "NDIS registration group (Provider Finder import)",
    }));
    result.push({
      abn: row.abn,
      name: row.name,
      ndisRegistered: row.ndisRegistered,
      email: row.email,
      phone: row.phone,
      website: row.website,
      serviceAreas: row.serviceAreas,
      specialisations: row.specialisations,
      locations: row.locations,
      services,
    });
  }

  return result;
}
