import { NextResponse } from "next/server";

import { exportMemory } from "@/lib/aura/memory";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "USER_ID_REQUIRED" }, { status: 400 });
  }
  try {
    return NextResponse.json(exportMemory(userId));
  } catch (err) {
    const message = err instanceof Error ? err.message : "AURA_ERROR";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
