import { checksumIndoorModel } from "./exporter";
import type { IndoorAccessModel } from "./model";

export function importIndoorModel(
  model: Omit<IndoorAccessModel, "checksum">,
): IndoorAccessModel {
  return { ...model, checksum: checksumIndoorModel(model) };
}
