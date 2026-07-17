import type { IndoorAccessModel } from "./model";

export function validateIndoorModel(model: IndoorAccessModel): string[] {
  const errors: string[] = [];
  if (!model.version) errors.push("missing_version");
  if (!model.checksum) errors.push("missing_checksum");
  return errors;
}
