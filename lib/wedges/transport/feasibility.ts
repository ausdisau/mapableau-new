import type { ProviderTransportAccess, TransportFeasibilityLevel } from "@/types/wedges";
import type { AccessNeedProfile } from "@/types/wedges";

export function computeTransportFeasibility(
  transport: ProviderTransportAccess,
  participantNeeds: AccessNeedProfile,
): TransportFeasibilityLevel {
  const needsWheelchair =
    participantNeeds.wheelchairAccess === true ||
    participantNeeds.powerchairAccess === true ||
    participantNeeds.transportSupportNeeded === true;

  if (transport.mobileProviderOption && participantNeeds.homeVisit === true) {
    return "strong";
  }

  if (needsWheelchair) {
    if (
      transport.accessibleParking === true &&
      transport.wheelchairAccessibleTaxiSuitable === true
    ) {
      return "strong";
    }
    if (
      transport.accessibleParking === true ||
      transport.nearestAccessiblePublicTransport
    ) {
      return "possible";
    }
    if (transport.telehealthOption) {
      return "needs_planning";
    }
    if (transport.accessibleParking === false) {
      return "likely_barrier";
    }
    return "unknown";
  }

  if (
    transport.nearestAccessiblePublicTransport ||
    transport.accessibleParking
  ) {
    return "possible";
  }
  if (transport.telehealthOption) {
    return "possible";
  }
  return "unknown";
}

export function transportFeasibilityLabel(level: TransportFeasibilityLevel): string {
  switch (level) {
    case "strong":
      return "Strong — transport looks workable";
    case "possible":
      return "Possible — plan ahead";
    case "needs_planning":
      return "Needs planning — confirm options";
    case "likely_barrier":
      return "Likely barrier — discuss alternatives";
    case "unknown":
      return "Unknown — confirm with provider";
    default: {
      const _exhaustive: never = level;
      return _exhaustive;
    }
  }
}
