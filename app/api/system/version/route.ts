import { NextResponse } from "next/server";

import { safeEnvSummary } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    name: "MapableAU",
    env: safeEnvSummary(),
  });
}
