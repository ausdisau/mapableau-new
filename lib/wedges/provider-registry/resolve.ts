import type { WedgeProvider } from "@/types/wedges";
import {
  getMockWedgeProvider,
  MOCK_WEDGE_PROVIDERS,
} from "@/lib/wedges/mock-providers";
import { wedgesConfig } from "@/lib/config/wedges";

/**
 * Resolve wedge overlay data for a provider by id or slug.
 */
export function resolveWedgeProvider(
  idOrSlug: string,
): WedgeProvider | undefined {
  if (!wedgesConfig.useMockData) return undefined;
  return (
    getMockWedgeProvider(idOrSlug) ??
    MOCK_WEDGE_PROVIDERS.find(
      (p) => p.slug === idOrSlug || p.name.toLowerCase() === idOrSlug.toLowerCase(),
    )
  );
}

export function listWedgeProviders(): WedgeProvider[] {
  if (!wedgesConfig.useMockData) return [];
  return MOCK_WEDGE_PROVIDERS;
}
