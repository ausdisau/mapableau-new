import type { AccessAssetDto } from "../types";
import { toAccessAssetResponseDto } from "../http/dto";

export function toPartnerAssetDto(
  asset: AccessAssetDto,
): Omit<
  AccessAssetDto,
  "ownerEntityId" | "operatorEntityId" | "maintainerEntityId"
> {
  const safeAsset = toAccessAssetResponseDto(asset);
  const {
    ownerEntityId: _ownerEntityId,
    operatorEntityId: _operatorEntityId,
    maintainerEntityId: _maintainerEntityId,
    ...dto
  } = safeAsset;
  return dto;
}
