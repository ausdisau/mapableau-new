import { isTfnswTripPlannerAvailable } from "@/lib/config/tfnsw";
import { isPtvAvailable } from "@/lib/config/ptv";
import { isTranslinkAvailable } from "@/lib/config/translink";
import { ptvPtAdapter } from "@/lib/public-transport/adapters/ptv-adapter";
import { tfnswPtAdapter } from "@/lib/public-transport/adapters/tfnsw-adapter";
import { translinkPtAdapter } from "@/lib/public-transport/adapters/translink-adapter";
import type { PtAdapter } from "@/lib/public-transport/pt-adapter";
import type { PtCapabilities, PtJurisdiction } from "@/lib/public-transport/types";
import { PT_DISCLAIMERS, PT_LINK_OUT } from "@/lib/public-transport/types";
import { TransportApiError } from "@/lib/transport/transport-api-error";

const ADAPTERS: Record<PtJurisdiction, PtAdapter> = {
  NSW: tfnswPtAdapter,
  VIC: ptvPtAdapter,
  QLD: translinkPtAdapter,
};

const UNAVAILABLE_CAPABILITIES: Record<PtJurisdiction, PtCapabilities> = {
  NSW: {
    jurisdiction: "NSW",
    tripPlanning: false,
    stopSearch: false,
    departures: false,
    disruptions: false,
    wheelchairFilter: false,
    linkOutUrl: PT_LINK_OUT.NSW,
    disclaimer: PT_DISCLAIMERS.NSW,
  },
  VIC: {
    jurisdiction: "VIC",
    tripPlanning: false,
    stopSearch: false,
    departures: false,
    disruptions: false,
    wheelchairFilter: false,
    linkOutUrl: PT_LINK_OUT.VIC,
    disclaimer: PT_DISCLAIMERS.VIC,
  },
  QLD: {
    jurisdiction: "QLD",
    tripPlanning: false,
    stopSearch: false,
    departures: false,
    disruptions: false,
    wheelchairFilter: false,
    linkOutUrl: PT_LINK_OUT.QLD,
    disclaimer: PT_DISCLAIMERS.QLD,
  },
};

function isJurisdictionConfigured(j: PtJurisdiction): boolean {
  switch (j) {
    case "NSW":
      return isTfnswTripPlannerAvailable();
    case "VIC":
      return isPtvAvailable();
    case "QLD":
      return isTranslinkAvailable();
    default: {
      const _exhaustive: never = j;
      return _exhaustive;
    }
  }
}

export function getPtCapabilities(jurisdiction: PtJurisdiction): PtCapabilities {
  if (!isJurisdictionConfigured(jurisdiction)) {
    return UNAVAILABLE_CAPABILITIES[jurisdiction];
  }
  return ADAPTERS[jurisdiction].capabilities;
}

export function getPtAdapter(jurisdiction: PtJurisdiction): PtAdapter {
  if (!isJurisdictionConfigured(jurisdiction)) {
    throw new TransportApiError(
      "TRANSPORT_ROUTE_PROVIDER_UNAVAILABLE",
      `Public transport data for ${jurisdiction} is not configured on the server.`
    );
  }
  return ADAPTERS[jurisdiction];
}

export function listConfiguredJurisdictions(): PtJurisdiction[] {
  return (["NSW", "VIC", "QLD"] as const).filter(isJurisdictionConfigured);
}
