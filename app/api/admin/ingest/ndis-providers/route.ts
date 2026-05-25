import { NextResponse } from "next/server";

import { runNdisProviderIngestion } from "@/lib/ingestion/ndisProviders";

export const runtime = "nodejs";
export const maxDuration = 300;

function verifyCronSecret(req: Request): boolean {
  const secret = process.env.ADMIN_CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  return auth.slice(7) === secret;
}

export async function POST(req: Request) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const result = await runNdisProviderIngestion({ dryRun: false });
    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Ingestion failed",
          durationMs: result.durationMs,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      providerCount: result.providerCount,
      runId: result.runId ?? null,
      durationMs: result.durationMs,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Ingestion failed" },
      { status: 500 },
    );
  }
}
