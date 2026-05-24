import { NextResponse } from "next/server";

import { safeEnvSummary } from "@/lib/env";
import { generateRequestId, REQUEST_ID_HEADER } from "@/lib/observability/request-id";

export async function GET() {
  const requestId = generateRequestId();
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      checks: { database: "not_probed_publicly" },
    },
    { headers: { [REQUEST_ID_HEADER]: requestId } }
  );
}
