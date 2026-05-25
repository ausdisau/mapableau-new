import type { ProviderOutlet, StateCode } from "@/data/provider-outlets.types";

const STATE_CODES = new Set<string>([
  "NSW",
  "VIC",
  "QLD",
  "SA",
  "WA",
  "TAS",
  "ACT",
  "NT",
]);

function asString(v: unknown): string {
  if (v == null) return "";
  return String(v);
}

function asNumber(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function asActive(v: unknown): 0 | 1 {
  return v === 1 || v === "1" || v === true ? 1 : 0;
}

function asRegGroup(v: unknown): number[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => Number(x)).filter((n) => Number.isFinite(n));
}

/**
 * Normalizes a raw NDIS list-providers row into ProviderOutlet.
 * Returns null if the row is not usable.
 */
export function normalizeProviderOutlet(raw: unknown): ProviderOutlet | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const state = asString(r.State_cd ?? r.state_cd).toUpperCase();
  if (!STATE_CODES.has(state)) return null;

  const abn = asString(r.ABN ?? r.abn).replace(/\s/g, "");
  const provN = asString(r.Prov_N ?? r.prov_n ?? r.ProviderName);
  const outletName = asString(r.Outletname ?? r.outletname);
  if (!abn && !provN && !outletName) return null;

  const flag = asString(r.Flag ?? r.flag).toUpperCase();
  const outletFlag = flag === "H" ? "H" : "O";

  return {
    ABN: abn,
    Prov_N: provN,
    Head_Office: asString(r.Head_Office ?? r.head_office),
    Outletname: outletName,
    Flag: outletFlag,
    Active: asActive(r.Active ?? r.active),
    Phone: asString(r.Phone ?? r.phone),
    Website: asString(r.Website ?? r.website),
    Email: asString(r.Email ?? r.email),
    Address: asString(r.Address ?? r.address),
    State_cd: state as StateCode,
    Post_cd: asNumber(r.Post_cd ?? r.post_cd),
    Latitude: asNumber(r.Latitude ?? r.latitude),
    Longitude: asNumber(r.Longitude ?? r.longitude),
    RegGroup: asRegGroup(r.RegGroup ?? r.regGroup ?? r.Reggroup),
    Post_cd_p: asString(r.Post_cd_p ?? r.post_cd_p),
    opnhrs: asString(r.opnhrs ?? r.opening_hours),
    prfsn: asString(r.prfsn ?? r.profession),
  };
}

export type NdisProviderBundle = {
  date: string;
  data: ProviderOutlet[];
};

export function parseNdisProviderJson(raw: unknown): NdisProviderBundle {
  if (Array.isArray(raw)) {
    const data = raw
      .map(normalizeProviderOutlet)
      .filter((o): o is ProviderOutlet => o !== null);
    return { date: new Date().toISOString().slice(0, 10), data };
  }

  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const date = asString(obj.date) || new Date().toISOString().slice(0, 10);
    const rows = obj.data ?? obj.providers ?? obj.outlets;
    if (Array.isArray(rows)) {
      const data = rows
        .map(normalizeProviderOutlet)
        .filter((o): o is ProviderOutlet => o !== null);
      return { date, data };
    }
  }

  throw new Error(
    "Unrecognized NDIS list-providers JSON shape (expected { data: [] } or an array)",
  );
}

export type MapPinRecord = {
  id: string;
  abn: string;
  name: string;
  suburb: string;
  state: StateCode;
  postcode: string;
  latitude: number;
  longitude: number;
  active: boolean;
};

export function hasValidCoordinates(o: ProviderOutlet): boolean {
  return (
    Number.isFinite(o.Latitude) &&
    Number.isFinite(o.Longitude) &&
    (o.Latitude !== 0 || o.Longitude !== 0) &&
    o.Latitude >= -44 &&
    o.Latitude <= -9 &&
    o.Longitude >= 112 &&
    o.Longitude <= 154
  );
}

export function buildMapPinRecords(
  outlets: ProviderOutlet[],
  idFactory: (o: ProviderOutlet, index: number) => string,
): MapPinRecord[] {
  const pins: MapPinRecord[] = [];
  outlets.forEach((o, index) => {
    if (!hasValidCoordinates(o)) return;
    const name = (o.Prov_N?.trim() || o.Outletname?.trim() || "Provider").trim();
    pins.push({
      id: idFactory(o, index),
      abn: o.ABN,
      name,
      suburb: "",
      state: o.State_cd,
      postcode: String(o.Post_cd),
      latitude: o.Latitude,
      longitude: o.Longitude,
      active: o.Active === 1,
    });
  });
  return pins;
}
