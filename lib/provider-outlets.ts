import type { ProviderOutlet } from "@/data/provider-outlets.types";

/**
 * URLs for provider-outlets JSON served from public/ (Next.js serves public/ at site root).
 * `provider-outlets.json` is the canonical generated name; `provider-outlets2.json`
 * is kept as a legacy fallback for the current checked-in MapAble data file.
 */
export const PROVIDER_OUTLETS_JSON_URL = "/data/provider-outlets.json";
export const PROVIDER_OUTLETS_JSON_FALLBACK_URL = "/data/provider-outlets2.json";

/**
 * Parses provider/outlet records from either the canonical `{ data: [...] }`
 * response or the legacy raw array checked into this branch.
 */
export function parseProviderOutletsPayload(raw: unknown): ProviderOutlet[] {
  const data = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && "data" in raw
      ? (raw as { data?: unknown }).data
      : null;

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Provider outlets response is not an array or is empty");
  }

  return data as ProviderOutlet[];
}

async function fetchProviderOutletsFromUrl(
  url: string,
  requestInit?: RequestInit,
): Promise<ProviderOutlet[]> {
  const res = await fetch(url, requestInit);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch provider outlets: ${res.status} ${res.statusText}`,
    );
  }

  return parseProviderOutletsPayload(await res.json());
}

/**
 * Fetches provider/outlet records from the public JSON.
 * Use in client or server; returns typed ProviderOutlet[].
 */
export async function fetchProviderOutlets(
  requestInit?: RequestInit,
): Promise<ProviderOutlet[]> {
  const base =
    typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_ORIGIN ?? "");
  const urls = [
    `${base}${PROVIDER_OUTLETS_JSON_URL}`,
    `${base}${PROVIDER_OUTLETS_JSON_FALLBACK_URL}`,
  ];
  let lastError: unknown;

  for (const url of urls) {
    try {
      return await fetchProviderOutletsFromUrl(url, requestInit);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to fetch provider outlets");
}

export type {
  ProviderOutlet,
  OutletFlag,
  StateCode,
} from "@/data/provider-outlets.types";
