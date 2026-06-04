import type {
  AusPostPacLocality,
  AusPostDomesticParcelCalculateResult,
  AusPostDomesticParcelService,
  AusPostPostcodeSearchResult,
  AusPostState,
} from "@/types/auspost-pac";

type RawLocality = {
  location?: string;
  state?: string;
  postcode?: string | number;
  category?: string;
};

type RawPostcodeSearchResponse = {
  localities?: {
    locality?: RawLocality | RawLocality[];
  };
};

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeLocality(row: RawLocality): AusPostPacLocality | null {
  const location = row.location?.trim();
  const state = row.state?.trim();
  const postcode = row.postcode != null ? String(row.postcode).trim() : "";
  if (!location || !state || !postcode) return null;
  return {
    location,
    state: state as AusPostState,
    postcode,
    category: row.category,
  };
}

export function normalizePostcodeSearchResponse(
  raw: RawPostcodeSearchResponse,
): AusPostPostcodeSearchResult {
  const rows = asArray(raw.localities?.locality);
  const localities = rows
    .map(normalizeLocality)
    .filter((row): row is AusPostPacLocality => row != null);
  return { localities };
}

type RawServiceRow = {
  code?: string;
  name?: string;
  price?: number | string;
  max_weight?: number | string;
  options?: {
    option?: RawOptionRow | RawOptionRow[];
  };
};

type RawOptionRow = {
  code?: string;
  name?: string;
  suboptions?: {
    suboption?: { code?: string; name?: string } | { code?: string; name?: string }[];
  };
};

type RawServiceResponse = {
  services?: {
    service?: RawServiceRow | RawServiceRow[];
  };
};

function normalizeOption(row: RawOptionRow) {
  const code = row.code?.trim();
  const name = row.name?.trim();
  if (!code || !name) return null;
  const suboptions = asArray(row.suboptions?.suboption)
    .map((s) => {
      const sc = s.code?.trim();
      const sn = s.name?.trim();
      return sc && sn ? { code: sc, name: sn } : null;
    })
    .filter((s): s is { code: string; name: string } => s != null);
  return { code, name, suboptions: suboptions.length ? suboptions : undefined };
}

function normalizeService(row: RawServiceRow): AusPostDomesticParcelService | null {
  const code = row.code?.trim();
  const name = row.name?.trim();
  if (!code || !name) return null;
  const price =
    typeof row.price === "number"
      ? row.price
      : row.price != null
        ? Number(row.price)
        : undefined;
  const maxWeight =
    typeof row.max_weight === "number"
      ? row.max_weight
      : row.max_weight != null
        ? Number(row.max_weight)
        : undefined;
  const options = asArray(row.options?.option)
    .map(normalizeOption)
    .filter((o): o is NonNullable<ReturnType<typeof normalizeOption>> => o != null);
  return {
    code,
    name,
    price: Number.isFinite(price) ? price : undefined,
    maxWeight: Number.isFinite(maxWeight) ? maxWeight : undefined,
    options: options.length ? options : undefined,
  };
}

export function normalizeDomesticServiceResponse(
  raw: RawServiceResponse,
): AusPostDomesticParcelService[] {
  return asArray(raw.services?.service)
    .map(normalizeService)
    .filter((s): s is AusPostDomesticParcelService => s != null);
}

type RawCalculateResponse = {
  postage_result?: {
    service?: string;
    delivery_time?: string;
    total_cost?: string | number;
    costs?: {
      cost?: { item?: string; cost?: string | number } | { item?: string; cost?: string | number }[];
    };
  };
};

export function normalizeDomesticCalculateResponse(
  raw: RawCalculateResponse,
): AusPostDomesticParcelCalculateResult | null {
  const pr = raw.postage_result;
  if (!pr?.service) return null;
  const totalCost =
    pr.total_cost != null ? String(pr.total_cost) : "";
  const costs = asArray(pr.costs?.cost)
    .map((c) => {
      const item = c.item?.trim();
      const cost = c.cost != null ? String(c.cost) : "";
      return item && cost ? { item, cost } : null;
    })
    .filter((c): c is { item: string; cost: string } => c != null);
  return {
    service: pr.service,
    deliveryTime: pr.delivery_time,
    totalCost,
    costs,
  };
}
