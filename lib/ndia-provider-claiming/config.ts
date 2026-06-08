import {
  getNdiaHttpConfig,
  isNdiaClaimingEnabled,
  isNdiaLiveSubmitAllowed,
} from "@/lib/ndia/shared/config";

/** @deprecated Import from @/lib/ndia/shared/config — kept for backward compatibility. */
export const ndiaProviderClaimingConfig = getNdiaHttpConfig();

export function isNdiaProviderClaimingEnabled(): boolean {
  return isNdiaClaimingEnabled();
}

export function isNdiaProviderLiveSubmitAllowed(): boolean {
  return isNdiaLiveSubmitAllowed();
}
