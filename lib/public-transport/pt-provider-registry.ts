import { isActAvailable } from "@/lib/config/act";
import { isAdelaideMetroAvailable } from "@/lib/config/adelaide-metro";
import { isNtTransportAvailable } from "@/lib/config/nt-transport";
import { isPtvAvailable } from "@/lib/config/ptv";
import { isTasmaniaAvailable } from "@/lib/config/tasmania";
import { isTfnswTripPlannerAvailable } from "@/lib/config/tfnsw";
import { isTranslinkAvailable } from "@/lib/config/translink";
import { isTransperthAvailable } from "@/lib/config/transperth";
import { actPtAdapter } from "@/lib/public-transport/adapters/act-adapter";
import { adelaideMetroPtAdapter } from "@/lib/public-transport/adapters/adelaide-metro-adapter";
import { ntTransportPtAdapter } from "@/lib/public-transport/adapters/nt-transport-adapter";
import { ptvPtAdapter } from "@/lib/public-transport/adapters/ptv-adapter";
import { tasmaniaPtAdapter } from "@/lib/public-transport/adapters/tasmania-adapter";
import { tfnswPtAdapter } from "@/lib/public-transport/adapters/tfnsw-adapter";
import { translinkPtAdapter } from "@/lib/public-transport/adapters/translink-adapter";
import { transperthPtAdapter } from "@/lib/public-transport/adapters/transperth-adapter";
import type { PtAdapter } from "@/lib/public-transport/pt-adapter";
import type { PtCapabilities, PtJurisdiction } from "@/lib/public-transport/types";
import { PT_DISCLAIMERS, PT_LINK_OUT } from "@/lib/public-transport/types";
import { TransportApiError } from "@/lib/transport/transport-api-error";

const ADAPTERS: Record<PtJurisdiction, PtAdapter> = {
  NSW: tfnswPtAdapter,
  VIC: ptvPtAdapter,
  QLD: translinkPtAdapter,
  ACT: actPtAdapter,
  SA: adelaideMetroPtAdapter,
  WA: transperthPtAdapter,
  TAS: tasmaniaPtAdapter,
  NT: ntTransportPtAdapter,
};

function unavailableCapabilities(jurisdiction: PtJurisdiction): PtCapabilities {
  return {
    jurisdiction,
    tripPlanning: false,
    stopSearch: false,
    departures: false,
    disruptions: false,
    wheelchairFilter: false,
    linkOutUrl: PT_LINK_OUT[jurisdiction],
    disclaimer: PT_DISCLAIMERS[jurisdiction],
  };
}

const UNAVAILABLE_CAPABILITIES: Record<PtJurisdiction, PtCapabilities> = {
  NSW: unavailableCapabilities("NSW"),
  VIC: unavailableCapabilities("VIC"),
  QLD: unavailableCapabilities("QLD"),
  ACT: unavailableCapabilities("ACT"),
  SA: unavailableCapabilities("SA"),
  WA: unavailableCapabilities("WA"),
  TAS: unavailableCapabilities("TAS"),
  NT: unavailableCapabilities("NT"),
};

function isJurisdictionConfigured(j: PtJurisdiction): boolean {
  switch (j) {
    case "NSW":
      return isTfnswTripPlannerAvailable();
    case "VIC":
      return isPtvAvailable();
    case "QLD":
      return isTranslinkAvailable();
    case "ACT":
      return isActAvailable();
    case "SA":
      return isAdelaideMetroAvailable();
    case "WA":
      return isTransperthAvailable();
    case "TAS":
      return isTasmaniaAvailable();
    case "NT":
      return isNtTransportAvailable();
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
  return (
    ["NSW", "VIC", "QLD", "ACT", "SA", "WA", "TAS", "NT"] as const
  ).filter(isJurisdictionConfigured);
}
