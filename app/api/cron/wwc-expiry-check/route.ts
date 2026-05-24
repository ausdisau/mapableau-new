import { NextResponse } from "next/server";

import { runWwcExpiryMonitor } from "@/lib/verification/wwc/wwc-expiry-monitor";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runWwcExpiryMonitor();
  return NextResponse.json({ ok: true, ...result });
}
