import type { AccessAssetDto } from "../types";

export function toPartnerAssetDto(
  asset: AccessAssetDto,
): Omit<
  AccessAssetDto,
  "ownerEntityId" | "operatorEntityId" | "maintainerEntityId"
> {
  const {
    ownerEntityId: _ownerEntityId,
    operatorEntityId: _operatorEntityId,
    maintainerEntityId: _maintainerEntityId,
    ...dto
  } = asset;
  return dto;
}
