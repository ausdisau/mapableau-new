import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import { Prisma } from "@prisma/client";

import { downloadNdisListProviders } from "@/lib/ndis-provider-ingest/download";
import { NDIS_LIST_PROVIDERS_URL } from "@/lib/ndis-provider-ingest/constants";
import { prisma } from "@/lib/prisma";

export const DEFAULT_NDIS_PROVIDER_SOURCE_URL = NDIS_LIST_PROVIDERS_URL;

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

export type NormalisedNdisProvider = {
  sourceId: string;
  providerName: string;
  legalName: string | null;
  abn: string | null;
  registrationNumber: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  latitude: number | null;
  longitude: number | null;
  services: string[];
  registrationGroups: string[];
  raw: Prisma.InputJsonValue;
  rawHash: string;
};

export type IngestionResult = {
  ok: boolean;
  dryRun: boolean;
  providerCount: number;
  rawRecordCount: number;
  runId?: string;
  durationMs: number;
  sourceHash: string;
  sourceUrl: string;
  error?: string;
  sample?: NormalisedNdisProvider;
  rawFieldKeys?: string[];
};

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

function pickString(
  raw: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const v = raw[key];
    if (v == null) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return null;
}

function pickNumber(raw: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const v = raw[key];
    if (v == null || v === "") continue;
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function pickStringArray(raw: Record<string, unknown>, keys: string[]): string[] {
  for (const key of keys) {
    const v = raw[key];
    if (Array.isArray(v)) {
      return v.map((x) => String(x).trim()).filter(Boolean);
    }
    if (typeof v === "string" && v.trim()) {
      return v
        .split(/[|,;]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function parseAddressParts(address: string | null): {
  suburb: string | null;
  state: string | null;
  postcode: string | null;
} {
  if (!address || address.toUpperCase() === "CONFIDENTIAL") {
    return { suburb: null, state: null, postcode: null };
  }
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const last = parts[parts.length - 1] ?? "";
    const tokens = last.split(/\s+/).filter(Boolean);
    const postcode = tokens[tokens.length - 1] ?? null;
    const state = tokens[tokens.length - 2]?.toUpperCase() ?? null;
    const suburb = parts[parts.length - 2] ?? null;
    return {
      suburb,
      state: state && AU_STATES.has(state) ? state : null,
      postcode,
    };
  }
  return { suburb: null, state: null, postcode: null };
}

function parseHeadOffice(headOffice: string | null): {
  suburb: string | null;
  state: string | null;
  postcode: string | null;
} {
  if (!headOffice?.trim()) {
    return { suburb: null, state: null, postcode: null };
  }
  const tokens = headOffice.trim().split(/\s+/).filter(Boolean);
  if (tokens.length >= 3) {
    const postcode = tokens[tokens.length - 1] ?? null;
    const state = tokens[tokens.length - 2]?.toUpperCase() ?? null;
    const suburb = tokens.slice(0, -2).join(" ");
    return {
      suburb,
      state: state && AU_STATES.has(state) ? state : null,
      postcode,
    };
  }
  return { suburb: headOffice, state: null, postcode: null };
}

export function extractProviderRecords(payload: unknown): {
  records: unknown[];
  sourceDate: string | null;
} {
  if (Array.isArray(payload)) {
    return { records: payload, sourceDate: null };
  }
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    const date =
      pickString(obj, ["date", "Date", "updated", "lastUpdated"]) ?? null;
    const candidates = [
      obj.data,
      obj.providers,
      obj.outlets,
      obj.results,
      obj.items,
      obj.records,
    ];
    for (const c of candidates) {
      if (Array.isArray(c)) return { records: c, sourceDate: date };
    }
    for (const value of Object.values(obj)) {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object") {
        return { records: value, sourceDate: date };
      }
    }
  }
  throw new Error(
    "Could not locate provider array in NDIS JSON payload (expected { data: [] } or a top-level array)",
  );
}

export function buildStableSourceId(
  raw: Record<string, unknown>,
  normalised: Pick<
    NormalisedNdisProvider,
    "registrationNumber" | "abn" | "providerName" | "address" | "postcode"
  >,
): string {
  const explicitId = pickString(raw, [
    "id",
    "Id",
    "providerId",
    "ProviderId",
    "organisationId",
    "OrganisationId",
    "outletId",
    "OutletId",
  ]);
  if (explicitId) return `id:${explicitId}`;

  if (normalised.registrationNumber) {
    const suffix = normalised.postcode ?? normalised.address ?? "";
    return `reg:${normalised.registrationNumber}:${suffix}`;
  }

  if (normalised.abn) {
    const outlet = pickString(raw, ["Outletname", "outletname", "outletName"]) ?? "";
    const suffix = outlet || normalised.postcode || normalised.address || "";
    return `abn:${normalised.abn}:${sha256Hex(suffix).slice(0, 16)}`;
  }

  const fingerprint = sha256Hex(
    JSON.stringify({
      name: normalised.providerName,
      address: normalised.address,
      postcode: normalised.postcode,
    }),
  );
  return `hash:${fingerprint.slice(0, 32)}`;
}

export function normaliseNdisProviderRecord(
  raw: unknown,
  sourceUrl: string,
): NormalisedNdisProvider | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const providerName =
    pickString(r, [
      "Prov_N",
      "prov_n",
      "ProviderName",
      "provider_name",
      "name",
      "Outletname",
      "outletname",
    ]) ?? "";
  if (!providerName) return null;

  const legalName = pickString(r, [
    "legalName",
    "LegalName",
    "organisationLegalName",
    "Outletname",
    "outletname",
  ]);

  const abn = pickString(r, ["ABN", "abn", "Abn"])?.replace(/\s/g, "") ?? null;
  const registrationNumber = pickString(r, [
    "ndisRegistrationNumber",
    "NdisRegistrationNumber",
    "registration_number",
    "RegistrationNumber",
    "NDISRegistrationNumber",
  ]);

  const address =
    pickString(r, ["Address", "address", "businessAddress"]) ?? null;
  const headOffice = pickString(r, ["Head_Office", "head_office", "headOffice"]);
  const fromAddress = parseAddressParts(address);
  const fromHead = parseHeadOffice(headOffice);
  const parsed = {
    suburb: fromAddress.suburb ?? fromHead.suburb,
    state: fromAddress.state ?? fromHead.state,
    postcode: fromAddress.postcode ?? fromHead.postcode,
  };

  const state =
    pickString(r, ["State_cd", "state_cd", "state", "State"])?.toUpperCase() ??
    parsed.state;
  const postcode =
    pickString(r, ["Post_cd", "post_cd", "postcode", "Postcode"]) ??
    parsed.postcode;

  const latitude = pickNumber(r, ["Latitude", "latitude", "lat"]);
  const longitude = pickNumber(r, ["Longitude", "longitude", "lng", "lon"]);

  const regGroupsNumeric = pickStringArray(r, ["RegGroup", "regGroup", "registration_groups"]);
  const regGroups = regGroupsNumeric.length
    ? regGroupsNumeric
    : pickString(r, ["registrationGroups", "RegistrationGroups"])
        ?.split(/[|,]/)
        .map((s) => s.trim())
        .filter(Boolean) ?? [];

  const profession = pickString(r, ["prfsn", "profession", "Profession", "services"]);
  const services = profession
    ? profession.split("|").map((s) => s.trim()).filter(Boolean)
    : pickStringArray(r, ["services", "Services", "serviceTypes"]);

  const providerNameDisplay =
    pickString(r, ["Prov_N", "prov_n", "ProviderName"])?.trim() ||
    providerName;

  const rawJson = r as Prisma.InputJsonValue;
  const rawHash = sha256Hex(JSON.stringify(r));

  const normalised: NormalisedNdisProvider = {
    sourceId: "",
    providerName: providerNameDisplay,
    legalName,
    abn,
    registrationNumber,
    phone: pickString(r, ["Phone", "phone", "contactPhone"]),
    email: pickString(r, ["Email", "email"]),
    website: pickString(r, ["Website", "website", "url"]),
    address,
    suburb: parsed.suburb,
    state: state && AU_STATES.has(state) ? state : parsed.state,
    postcode: postcode ? String(postcode) : parsed.postcode,
    latitude:
      latitude != null &&
      longitude != null &&
      (latitude !== 0 || longitude !== 0)
        ? latitude
        : null,
    longitude:
      latitude != null &&
      longitude != null &&
      (latitude !== 0 || longitude !== 0)
        ? longitude
        : null,
    services,
    registrationGroups: regGroups,
    raw: rawJson,
    rawHash,
  };

  normalised.sourceId = buildStableSourceId(r, normalised);
  return normalised;
}

export type RunIngestionOptions = {
  sourceUrl?: string;
  inputPath?: string;
  dryRun?: boolean;
};

const UPSERT_BATCH = 100;

// TODO: Mark providers missing from the latest ingest as stale/archived instead of leaving old rows indefinitely.

export async function runNdisProviderIngestion(
  options: RunIngestionOptions = {},
): Promise<IngestionResult> {
  const started = Date.now();
  const dryRun = options.dryRun ?? process.env.DRY_RUN === "true";
  const sourceUrl =
    options.sourceUrl ??
    process.env.NDIS_PROVIDER_SOURCE_URL ??
    DEFAULT_NDIS_PROVIDER_SOURCE_URL;

  let jsonText: string;
  if (options.inputPath) {
    jsonText = await readFile(options.inputPath, "utf8");
  } else {
    const dl = await downloadNdisListProviders(sourceUrl);
    if (!dl.ok) {
      return {
        ok: false,
        dryRun,
        providerCount: 0,
        rawRecordCount: 0,
        durationMs: Date.now() - started,
        sourceHash: "",
        sourceUrl,
        error: dl.hint ? `${dl.error}. ${dl.hint}` : dl.error,
      };
    }
    jsonText = dl.body;
  }

  const sourceHash = sha256Hex(jsonText);
  const payload = JSON.parse(jsonText) as unknown;
  const { records, sourceDate } = extractProviderRecords(payload);

  const normalised: NormalisedNdisProvider[] = [];
  for (const rec of records) {
    const row = normaliseNdisProviderRecord(rec, sourceUrl);
    if (row) normalised.push(row);
  }

  const sample = normalised[0];
  const rawFieldKeys =
    records[0] && typeof records[0] === "object"
      ? Object.keys(records[0] as Record<string, unknown>).sort()
      : [];

  if (dryRun) {
    return {
      ok: true,
      dryRun: true,
      providerCount: normalised.length,
      rawRecordCount: records.length,
      durationMs: Date.now() - started,
      sourceHash,
      sourceUrl,
      sample,
      rawFieldKeys,
    };
  }

  let runId: string | undefined;
  try {
    const run = await prisma.ndisProviderIngestionRun.create({
      data: {
        sourceUrl,
        sourceHash,
        providerCount: 0,
        status: "running",
      },
    });
    runId = run.id;

    const sourceUpdatedAt = sourceDate ? tryParseSourceDate(sourceDate) : null;
    let upserted = 0;

    for (let i = 0; i < normalised.length; i += UPSERT_BATCH) {
      const chunk = normalised.slice(i, i + UPSERT_BATCH);
      await prisma.$transaction(
        chunk.map((row) =>
          prisma.ndisProvider.upsert({
            where: { sourceId: row.sourceId },
            create: {
              sourceId: row.sourceId,
              providerName: row.providerName,
              legalName: row.legalName,
              abn: row.abn,
              registrationNumber: row.registrationNumber,
              phone: row.phone,
              email: row.email,
              website: row.website,
              address: row.address,
              suburb: row.suburb,
              state: row.state,
              postcode: row.postcode,
              latitude: row.latitude,
              longitude: row.longitude,
              services: row.services,
              registrationGroups: row.registrationGroups,
              raw: row.raw,
              rawHash: row.rawHash,
              sourceUrl,
              sourceUpdatedAt,
            },
            update: {
              providerName: row.providerName,
              legalName: row.legalName,
              abn: row.abn,
              registrationNumber: row.registrationNumber,
              phone: row.phone,
              email: row.email,
              website: row.website,
              address: row.address,
              suburb: row.suburb,
              state: row.state,
              postcode: row.postcode,
              latitude: row.latitude,
              longitude: row.longitude,
              services: row.services,
              registrationGroups: row.registrationGroups,
              raw: row.raw,
              rawHash: row.rawHash,
              sourceUrl,
              sourceUpdatedAt,
            },
          }),
        ),
      );
      upserted += chunk.length;
    }

    await prisma.ndisProviderIngestionRun.update({
      where: { id: run.id },
      data: {
        status: "success",
        providerCount: upserted,
        finishedAt: new Date(),
      },
    });

    return {
      ok: true,
      dryRun: false,
      providerCount: upserted,
      rawRecordCount: records.length,
      runId,
      durationMs: Date.now() - started,
      sourceHash,
      sourceUrl,
      sample,
      rawFieldKeys,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ingestion failed";
    if (runId) {
      await prisma.ndisProviderIngestionRun
        .update({
          where: { id: runId },
          data: {
            status: "failed",
            errorMessage: message,
            finishedAt: new Date(),
          },
        })
        .catch(() => undefined);
    }
    return {
      ok: false,
      dryRun: false,
      providerCount: 0,
      rawRecordCount: records.length,
      runId,
      durationMs: Date.now() - started,
      sourceHash,
      sourceUrl,
      error: message,
    };
  }
}

function tryParseSourceDate(dateStr: string): Date | null {
  const parsed = Date.parse(dateStr);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed);
}

export async function getLatestIngestionRun() {
  return prisma.ndisProviderIngestionRun.findFirst({
    orderBy: { startedAt: "desc" },
  });
}

export type NdisProviderSearchParams = {
  q?: string;
  state?: string;
  postcode?: string;
  service?: string;
  limit?: number;
};

export type NdisProviderSearchRow = {
  source_id: string;
  provider_name: string;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  services: string[];
  registration_groups: string[];
  updated_at: Date;
};

export async function searchNdisProviders(
  params: NdisProviderSearchParams,
): Promise<{
  providers: NdisProviderSearchRow[];
  count: number;
  filters_applied: Record<string, string | number>;
}> {
  const limit = Math.min(Math.max(params.limit ?? 25, 1), 100);
  const filters_applied: Record<string, string | number> = { limit };

  const conditions: Prisma.Sql[] = [Prisma.sql`TRUE`];

  if (params.q?.trim()) {
    filters_applied.q = params.q.trim();
    const term = params.q.trim();
    conditions.push(
      Prisma.sql`to_tsvector('english', provider_name) @@ plainto_tsquery('english', ${term})`,
    );
  }

  if (params.state?.trim()) {
    const st = params.state.trim().toUpperCase();
    filters_applied.state = st;
    conditions.push(Prisma.sql`state = ${st}`);
  }

  if (params.postcode?.trim()) {
    filters_applied.postcode = params.postcode.trim();
    conditions.push(Prisma.sql`postcode = ${params.postcode.trim()}`);
  }

  if (params.service?.trim()) {
    filters_applied.service = params.service.trim();
    conditions.push(
      Prisma.sql`${params.service.trim()} = ANY(services)`,
    );
  }

  const whereClause = Prisma.join(conditions, " AND ");

  const providers = await prisma.$queryRaw<NdisProviderSearchRow[]>`
    SELECT
      source_id,
      provider_name,
      suburb,
      state,
      postcode,
      phone,
      email,
      website,
      services,
      registration_groups,
      updated_at
    FROM ndis_providers
    WHERE ${whereClause}
    ORDER BY provider_name ASC
    LIMIT ${limit}
  `;

  return {
    providers,
    count: providers.length,
    filters_applied,
  };
}
