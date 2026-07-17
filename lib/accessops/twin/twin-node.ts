import type { AccessAsset } from "@prisma/client";

import type { AccessTwinNode } from "../types";
import { isRestrictedClassification } from "../types";

export function toTwinNode(asset: AccessAsset): AccessTwinNode | null {
  if (isRestrictedClassification(asset.securityClassification)) return null;
  if (
    asset.publicVisibility === "never_public" ||
    asset.publicVisibility === "restricted"
  )
    return null;
  return {
    assetId: asset.id,
    assetType: asset.assetType,
    publicIdentifier: asset.publicIdentifier,
    securityClassification: asset.securityClassification,
    publicVisibility: asset.publicVisibility,
    title: asset.title,
  };
}

export function filterPublicTwinNodes(assets: AccessAsset[]): AccessTwinNode[] {
  return assets.flatMap((asset) => {
    const node = toTwinNode(asset);
    return node ? [node] : [];
  });
}
