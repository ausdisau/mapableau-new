import { NextResponse } from "next/server";

import {
  getMapableAgentRuntimeIssues,
  isMapableAgentConfigured,
  mapableAgentConfig,
} from "@/lib/mapable-agent/config";

export const runtime = "nodejs";

/** Deployment health for MapAble Agent (no auth — status only). */
export async function GET() {
  return NextResponse.json({
    enabled: isMapableAgentConfigured(),
    isVercel: mapableAgentConfig.isVercel,
    modelProvider: mapableAgentConfig.modelProvider,
    queueEnabled: mapableAgentConfig.queueEnabled,
    issues: getMapableAgentRuntimeIssues(),
  });
}
