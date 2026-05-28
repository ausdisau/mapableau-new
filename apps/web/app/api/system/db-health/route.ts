import { NextResponse } from "next/server";

import { postgresAdapter } from "@/lib/integrations/adapters/postgres-adapter";

export async function GET() {
  const health = await postgresAdapter.healthCheck();
  return NextResponse.json({
    service: "database",
    ...health,
    timestamp: new Date().toISOString(),
  });
}
