import type { GeoscapeProduct, GeoscapeSourceReference } from "@/lib/spatial/types";

const DEFAULT_ATTRIBUTION =
  "Geoscape Australia — address data used under applicable licence terms";

export function createGeoscapeSourceReference(input: {
  product: GeoscapeProduct;
  endpoint: string;
  dataset?: string;
  release?: string;
  sourceDate?: string;
  licenceIdentifier?: string;
  retrievedAt?: string;
}): GeoscapeSourceReference {
  return {
    product: input.product,
    endpoint: input.endpoint,
    dataset: input.dataset,
    release: input.release,
    retrievedAt: input.retrievedAt ?? new Date().toISOString(),
    sourceDate: input.sourceDate,
    attribution: DEFAULT_ATTRIBUTION,
    licenceIdentifier: input.licenceIdentifier,
  };
}
