import { NextResponse } from "next/server";

import {
  isMobileApiEnabled,
  mobileApiConfig,
  mobileApiDisabledResponse,
} from "@/lib/mobile";

/**
 * GET /api/mobile/bootstrap — public, flag-gated (Phase 05).
 * No business logic duplication — returns flags and policy only.
 */
export async function GET() {
  if (!isMobileApiEnabled()) {
    return NextResponse.json(mobileApiDisabledResponse(), { status: 503 });
  }

  return NextResponse.json({
    apiBaseUrl: mobileApiConfig.apiBaseUrl,
    minAppVersionCode: mobileApiConfig.minAppVersionCode,
    featureFlags: {
      mobileApiEnabled: mobileApiConfig.apiEnabled,
      authExchangeEnabled: mobileApiConfig.authExchangeEnabled,
      pushEnabled: mobileApiConfig.pushEnabled,
      integrityEnabled: mobileApiConfig.integrityEnabled,
      fusedLocationEnabled: mobileApiConfig.fusedLocationEnabled,
      socketIoEnabled: mobileApiConfig.socketIoEnabled,
    },
    notificationPolicy: {
      redactedPreviewOnly: true,
      showParticipantNames: false,
    },
    realtimeMode: mobileApiConfig.socketIoEnabled ? "socket_io" : "polling",
    maps: {
      provider: "maplibre",
      basemap: "openstreetmap",
      googleMapsForAccess: false,
    },
    redis: {
      clientAccess: "forbidden",
      note: "Redis/Upstash is server-side cache only",
    },
  });
}
