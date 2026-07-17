import { NextResponse } from "next/server";

import {
  accessCastFlags,
  compileAccessCastOfflinePack,
  evaluateAccessCastOfflinePack,
  hashAccessCastOfflineContent,
} from "@/lib/accesscast";

export const dynamic = "force-dynamic";

/**
 * Synthetic offline AccessCast Visit Pack compile + evaluate demo.
 * No device push; returns pack JSON for Companion contract integration.
 */
export async function POST(request: Request) {
  if (!accessCastFlags.enabled || !accessCastFlags.allowSyntheticExecution) {
    return NextResponse.json(
      { error: "AccessCast offline demo is disabled", productionClaim: "none" },
      { status: 404 },
    );
  }

  let body: {
    asOf?: string;
    ttlHours?: number;
    simulateExpired?: boolean;
    simulateChanged?: boolean;
    scenario?: "starting_work_tomorrow" | "offline_expired" | "return_journey_fragile";
  } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const pack = compileAccessCastOfflinePack({
    journey: {
      scenario: body.scenario ?? "starting_work_tomorrow",
      asOf: "2026-07-16T18:00:00.000+10:00",
      intendedJourneyTime: "2026-07-17T08:30:00.000+10:00",
    },
    ttlHours: body.ttlHours ?? 6,
    generatedAt: body.simulateExpired
      ? "2026-07-15T08:00:00.000+10:00"
      : "2026-07-16T18:00:00.000+10:00",
  });

  // Force expiry for offline_expired / simulateExpired demos
  const saved = body.simulateExpired
    ? (() => {
        const expiresAt = "2026-07-15T20:00:00.000+10:00";
        const { contentHash: _discard, ...packBody } = pack;
        return {
          ...pack,
          expiresAt,
          contentHash: hashAccessCastOfflineContent({
            ...packBody,
            expiresAt,
          }),
        };
      })()
    : pack;

  const latestHash = body.simulateChanged
    ? (() => {
        const { contentHash: _discard, ...savedBody } = saved;
        return hashAccessCastOfflineContent({
          ...savedBody,
          conclusionState: "temporarily_unavailable",
        });
      })()
    : saved.contentHash;

  const evaluation = evaluateAccessCastOfflinePack({
    saved,
    asOf: body.asOf ?? "2026-07-16T22:00:00.000+10:00",
    latestContentHash: latestHash,
  });

  return NextResponse.json({
    mode: accessCastFlags.mode,
    synthetic: true,
    productionClaim: "none",
    storageKey: "companion.accesscast.outlook.v1",
    pack: saved,
    evaluation: {
      isExpired: evaluation.isExpired,
      changedSinceSaved: evaluation.changedSinceSaved,
      displayState: evaluation.displayState,
      statusLabel: evaluation.statusLabel,
      displayLimitations: evaluation.displayLimitations,
    },
  });
}

export async function GET() {
  return POST(
    new Request("http://local/accesscast/offline/demo", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    }),
  );
}
