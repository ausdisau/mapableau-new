import { geoscapePredictiveGetJson } from "@/lib/geoscape-predictive/client";
import {
  geoscapeNotFoundError,
  geoscapeValidationError,
} from "@/lib/geoscape-predictive/geoscape-predictive-api-error";
import {
  normalizeAddressResponse,
  normalizeSuggestResponse,
} from "@/lib/geoscape-predictive/normalize";
import { geoscapePredictiveConfig } from "@/lib/config/geoscape-predictive";
import type {
  GeoscapeResolvedAddress,
  GeoscapeSuggestResult,
} from "@/types/geoscape-predictive";

export type SuggestAddressesParams = {
  q: string;
  limit?: number;
  stateTerritory?: string;
};

export async function suggestAddresses(
  params: SuggestAddressesParams,
): Promise<GeoscapeSuggestResult> {
  const q = params.q.trim();
  if (q.length < geoscapePredictiveConfig.minQueryLength) {
    return { suggest: [] };
  }

  const raw = await geoscapePredictiveGetJson<unknown>({
    path: "/predictive/address",
    query: {
      query: q,
      dataset: geoscapePredictiveConfig.dataset,
      maxNumberOfResults: params.limit ?? 10,
      ...(params.stateTerritory
        ? { stateTerritory: params.stateTerritory }
        : {}),
    },
  });

  const normalized = normalizeSuggestResponse(raw);
  if (params.limit !== undefined) {
    return { suggest: normalized.suggest.slice(0, params.limit) };
  }
  return normalized;
}

export async function getAddress(
  id: string,
): Promise<GeoscapeResolvedAddress> {
  const trimmed = id.trim();
  if (!trimmed) {
    throw geoscapeValidationError("Address id is required.");
  }

  const encoded = encodeURIComponent(trimmed);
  try {
    const raw = await geoscapePredictiveGetJson<unknown>({
      path: `/predictive/address/${encoded}`,
    });
    const resolved = normalizeAddressResponse(raw, trimmed);
    if (!resolved) {
      throw geoscapeNotFoundError();
    }
    return resolved;
  } catch (err) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "GEOSCAPE_UPSTREAM_ERROR" &&
      (err as { details?: { upstreamStatus?: number } }).details
        ?.upstreamStatus === 404
    ) {
      throw geoscapeNotFoundError();
    }
    throw err;
  }
}
