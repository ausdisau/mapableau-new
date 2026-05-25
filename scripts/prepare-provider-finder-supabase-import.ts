import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { regGroupIndicesToCategories } from "../app/provider-finder/regGroupOptions";

type ProviderOutlet = {
  ABN: string;
  Prov_N: string;
  Head_Office: string;
  Outletname: string;
  Flag: "O" | "H";
  Active: 0 | 1;
  Phone: string;
  Website: string;
  Email: string;
  Address: string;
  State_cd: string;
  Post_cd: number;
  Latitude: number;
  Longitude: number;
  RegGroup: number[];
  Post_cd_p: string;
  opnhrs: string;
  prfsn: string;
};

type ProviderOutletsFile = {
  data?: ProviderOutlet[];
};

type ImportProfile = {
  legacyProviderId: string;
  slug: string;
  name: string;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  isVerified: boolean;
  isSearchVisible: boolean;
};

type ImportService = {
  providerSlug: string;
  name: string;
};

type ParsedLocation = {
  suburb: string | null;
  state: string | null;
  postcode: string | null;
};

const sourcePath = path.join(
  process.cwd(),
  "public",
  "data",
  "provider-outlets.json",
);

const writeArg = process.argv.find((arg) => arg.startsWith("--write="));
const writePath = writeArg
  ? path.resolve(process.cwd(), writeArg.slice("--write=".length))
  : null;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function uniqueSlug(base: string, seen: Map<string, number>): string {
  const normalized = slugify(base) || "provider";
  const count = seen.get(normalized) ?? 0;
  seen.set(normalized, count + 1);
  return count === 0 ? normalized : `${normalized}-${count + 1}`;
}

function parseAddress(address: string, fallback: string): ParsedLocation {
  const raw = address.trim();
  if (raw && raw.toUpperCase() !== "CONFIDENTIAL") {
    const parts = raw
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      const suburb = parts.at(-2) ?? null;
      const last = parts.at(-1) ?? "";
      const tokens = last.split(/\s+/).filter(Boolean);
      return {
        suburb,
        state: tokens.at(-2) ?? null,
        postcode: tokens.at(-1) ?? null,
      };
    }
  }

  const fallbackTokens = fallback.trim().split(/\s+/).filter(Boolean);
  if (fallbackTokens.length >= 3) {
    return {
      suburb: fallbackTokens.slice(0, -2).join(" "),
      state: fallbackTokens.at(-2) ?? null,
      postcode: fallbackTokens.at(-1) ?? null,
    };
  }

  return {
    suburb: fallback.trim() || null,
    state: null,
    postcode: null,
  };
}

function legacyProviderId(outlet: ProviderOutlet): string {
  const outletName = outlet.Outletname || outlet.Prov_N || "unknown";
  const address = outlet.Address || outlet.Head_Office || "unknown";
  return [
    "ndia-outlet",
    outlet.ABN || "unknown-abn",
    slugify(outletName) || "unknown-outlet",
    slugify(address) || "unknown-address",
  ].join(":");
}

function serviceNames(outlet: ProviderOutlet): string[] {
  const fromRegGroups = regGroupIndicesToCategories(outlet.RegGroup ?? []);
  const fromProfession = (outlet.prfsn ?? "")
    .split("|")
    .map((service) => service.trim())
    .filter(Boolean);

  return [...new Set([...fromRegGroups, ...fromProfession])];
}

async function main() {
  const raw = JSON.parse(
    await readFile(sourcePath, "utf8"),
  ) as ProviderOutletsFile;
  const outlets = raw.data;

  if (!Array.isArray(outlets) || outlets.length === 0) {
    throw new Error(
      "Provider outlets source is missing a non-empty data array.",
    );
  }

  const seenSlugs = new Map<string, number>();
  const missingCoreFields: number[] = [];
  const duplicateLegacyIds = new Map<string, number>();
  const profiles: ImportProfile[] = [];
  const services: ImportService[] = [];

  outlets.forEach((outlet, index) => {
    const name = (outlet.Prov_N || outlet.Outletname || "").trim();
    if (!name || !outlet.ABN) {
      missingCoreFields.push(index);
    }

    const legacyId = legacyProviderId(outlet);
    duplicateLegacyIds.set(
      legacyId,
      (duplicateLegacyIds.get(legacyId) ?? 0) + 1,
    );

    const location = parseAddress(
      outlet.Address ?? "",
      outlet.Head_Office ?? "",
    );
    const slug = uniqueSlug(name, seenSlugs);
    profiles.push({
      legacyProviderId: legacyId,
      slug,
      name: name || `Provider ${index + 1}`,
      suburb: location.suburb,
      state: location.state ?? outlet.State_cd ?? null,
      postcode: location.postcode ?? String(outlet.Post_cd || ""),
      isVerified: outlet.Active === 1,
      isSearchVisible: outlet.Active === 1,
    });

    for (const serviceName of serviceNames(outlet)) {
      services.push({
        providerSlug: slug,
        name: serviceName,
      });
    }
  });

  const duplicatedLegacyIds = [...duplicateLegacyIds.entries()].filter(
    ([, count]) => count > 1,
  );
  const activeCount = outlets.filter((outlet) => outlet.Active === 1).length;
  const missingLiveEnv = [
    "DATABASE_URL",
    "DIRECT_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ].filter((name) => !process.env[name]);

  const summary = {
    sourcePath,
    sourceRecords: outlets.length,
    activeSearchVisibleRecords: activeCount,
    proposedProviderProfiles: profiles.length,
    proposedProviderServices: services.length,
    missingCoreFieldRows: missingCoreFields.length,
    duplicateLegacyIds: duplicatedLegacyIds.length,
    missingLiveMigrationEnv: missingLiveEnv,
    wroteImportPreview: writePath,
  };

  if (writePath) {
    await writeFile(
      writePath,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          profiles,
          services,
        },
        null,
        2,
      ),
    );
  }

  console.log("Provider finder Supabase import dry run");
  console.log(JSON.stringify(summary, null, 2));

  if (missingCoreFields.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
