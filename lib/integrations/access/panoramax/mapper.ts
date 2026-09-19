import {
  createUnverifiedProvenance,
  evidenceRefSchema,
  normalizedObservationSchema,
  type NormalizedObservation,
} from "../contracts";
import { PanoramaxError } from "./errors";
import { panoramaxItemSchema, type PanoramaxItem } from "./schemas";

function extractImageHref(item: PanoramaxItem): string | undefined {
  if (!item.assets) return undefined;
  for (const asset of Object.values(item.assets)) {
    if (
      asset.roles?.includes("data") ||
      asset.roles?.includes("visual") ||
      asset.type?.startsWith("image/")
    ) {
      return asset.href;
    }
  }
  return Object.values(item.assets)[0]?.href;
}

function allowlistedHref(
  href: string,
  allowedHosts: string[],
): string | undefined {
  try {
    if (href.startsWith("/")) return href;
    const url = new URL(href);
    if (url.protocol !== "https:" && url.protocol !== "http:") return undefined;
    if (allowedHosts.length === 0) return undefined;
    if (
      !allowedHosts.some(
        (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
      )
    ) {
      return undefined;
    }
    return url.toString();
  } catch {
    return undefined;
  }
}

export function mapPanoramaxItemToObservation(
  raw: unknown,
  options: { allowedHosts?: string[]; sourceBaseUrl?: string } = {},
): NormalizedObservation {
  const parsed = panoramaxItemSchema.safeParse(raw);
  if (!parsed.success) {
    throw new PanoramaxError(
      "INVALID_PAYLOAD",
      `Invalid Panoramax item: ${parsed.error.message}`,
      400,
    );
  }
  const item = parsed.data;
  const allowedHosts = options.allowedHosts ?? [];
  const imageHref = extractImageHref(item);
  const safeHref = imageHref
    ? allowlistedHref(imageHref, allowedHosts)
    : undefined;

  const evidenceRefs = safeHref
    ? [
        evidenceRefSchema.parse({
          id: `panoramax:${item.id}:asset`,
          kind: "image",
          uri: safeHref,
          publicationState: "PRIVATE_EVIDENCE",
          capturedAt: item.properties?.datetime,
        }),
      ]
    : [];

  const licence =
    item.properties?.licence ?? item.properties?.license ?? undefined;

  const provenance = createUnverifiedProvenance({
    sourceProvider: "panoramax",
    sourceReference: item.id,
    sourceUrl: options.sourceBaseUrl
      ? `${options.sourceBaseUrl.replace(/\/$/, "")}/api/collections/-/items/${item.id}`
      : undefined,
    contributorType: "COMMUNITY",
    evidenceRefs,
    attribution: "Panoramax",
    licence,
    capturedAt: item.properties?.datetime,
  });

  const coords = item.geometry?.coordinates;
  return normalizedObservationSchema.parse({
    featureType: "street_level_imagery",
    attribute: "photographic_evidence",
    value: "UNKNOWN",
    valueQualifier: "UNKNOWN",
    geometry: coords
      ? { type: "Point", coordinates: [coords[0], coords[1]] }
      : undefined,
    observedAt: item.properties?.datetime,
    notes:
      "Panoramax imagery is photographic evidence only — not an accessibility capability claim.",
    provenance,
    claimStrength: "observation",
  });
}
