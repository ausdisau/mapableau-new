import type { Provider } from "@/app/provider-finder/providers";
import type { ProviderOutlet } from "@/data/provider-outlets.types";

/**
 * URL for provider-outlets JSON served from public/ (Next.js serves public/ at site root).
 * File lives at public/data/provider-outlets.json → URL /data/provider-outlets.json
 */
export const PROVIDER_OUTLETS_JSON_URL = "/data/provider-outlets.json";
export const PROVIDER_DIRECTORY_API_URL = "/api/provider-finder/providers";

/**
 * Fetches merged provider directory (database + legacy users + outlet JSON fallback).
 */
export async function fetchProviderDirectory(
  requestInit?: RequestInit,
): Promise<Provider[]> {
  const base =
    typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_ORIGIN ?? "");
  const res = await fetch(`${base}${PROVIDER_DIRECTORY_API_URL}`, requestInit);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch provider directory: ${res.status} ${res.statusText}`,
    );
  }
  const raw = (await res.json()) as { data?: Provider[] };
  if (!raw.data || !Array.isArray(raw.data)) {
    throw new Error("Provider directory response is not an array");
  }
  return raw.data;
}

/**
 * Fetches provider/outlet records from the public JSON (public/data/provider-outlets.json).
 * Use in client or server; returns typed ProviderOutlet[].
 */
export async function fetchProviderOutlets(
  requestInit?: RequestInit,
): Promise<ProviderOutlet[]> {
  const base =
    typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_ORIGIN ?? "");
  const url = `${base}${PROVIDER_OUTLETS_JSON_URL}`;
  const res = await fetch(url, requestInit);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch provider outlets: ${res.status} ${res.statusText}`,
    );
  }
  const raw = (await res.json()) as { data: ProviderOutlet[] };
  const data = raw.data;
  if (!data || !Array.isArray(data)) {
    throw new Error("Provider outlets response is not an array or is empty");
  }
  return data;
}

/** @deprecated Use fetchProviderDirectory — kept for scripts that need raw outlets. */
export async function fetchProviderOutletsAsFinder(
  requestInit?: RequestInit,
): Promise<Provider[]> {
  return fetchProviderDirectory(requestInit);
}

export type {
  ProviderOutlet,
  OutletFlag,
  StateCode,
} from "@/data/provider-outlets.types";
