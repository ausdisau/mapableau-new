import type { DataClass } from "@/lib/ai/platform/types/classification";

import type { ProcessingSensitivity, ProcessingZone } from "../contracts";
import type { ProcessingProviderRecord } from "./contracts";
import { listApprovedProcessingProviders } from "./registry";

export function providerAllowsSensitivity(
  provider: ProcessingProviderRecord,
  sensitivity: ProcessingSensitivity
): boolean {
  return provider.permittedSensitivity.includes(sensitivity);
}

export function providerAllowsDataClasses(
  provider: ProcessingProviderRecord,
  dataClasses: DataClass[]
): boolean {
  for (const dc of dataClasses) {
    if (provider.prohibitedDataClasses.includes(dc)) return false;
    if (
      provider.permittedDataClasses.length > 0 &&
      !provider.permittedDataClasses.includes(dc)
    ) {
      return false;
    }
  }
  return true;
}

export function providerAllowsPurpose(
  provider: ProcessingProviderRecord,
  purpose: string
): boolean {
  return (
    provider.permittedPurposes.length === 0 ||
    provider.permittedPurposes.includes(purpose)
  );
}

export function providerSupportsZone(
  provider: ProcessingProviderRecord,
  zone: ProcessingZone
): boolean {
  return provider.deploymentZones.includes(zone);
}

export function selectEligibleProviders(input: {
  zone: ProcessingZone;
  sensitivity: ProcessingSensitivity;
  dataClasses: DataClass[];
  purpose: string;
}): ProcessingProviderRecord[] {
  return listApprovedProcessingProviders().filter(
    (p) =>
      providerSupportsZone(p, input.zone) &&
      providerAllowsSensitivity(p, input.sensitivity) &&
      providerAllowsDataClasses(p, input.dataClasses) &&
      providerAllowsPurpose(p, input.purpose)
  );
}
