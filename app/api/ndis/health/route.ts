import { NextResponse } from "next/server";

import { runAdapterHealthCheck, ensureDefaultIntegrationSetting } from "@/lib/ndis/ndis-integration-service";

export async function GET() {
  await ensureDefaultIntegrationSetting();
  const health = await runAdapterHealthCheck();
  return NextResponse.json(health);
}
