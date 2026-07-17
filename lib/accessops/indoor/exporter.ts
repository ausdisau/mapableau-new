import { createHash } from "crypto";

import type { IndoorAccessModel } from "./model";

export function checksumIndoorModel(
  model: Omit<IndoorAccessModel, "checksum">,
): string {
  return createHash("sha256").update(JSON.stringify(model)).digest("hex");
}

export function exportIndoorModel(model: IndoorAccessModel): IndoorAccessModel {
  return {
    ...model,
    nodes: model.nodes.filter(
      (node) => !model.restrictedZoneIds.includes(String(node.zoneId ?? "")),
    ),
  };
}
