import { NextResponse } from "next/server";

import { auraFlags } from "@/lib/aura/feature-flags";
import {
  getCommunicationProfile,
  setCommunicationProfile,
} from "@/lib/aura/communication";
import type { PresentationMode } from "@/lib/aura/communication";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!auraFlags.enabled && process.env.MAPABLE_AURA_DEMO !== "true") {
    return NextResponse.json({ error: "MAPABLE_AURA_DISABLED" }, { status: 403 });
  }
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "USER_ID_REQUIRED" }, { status: 400 });
  }
  return NextResponse.json({ profile: getCommunicationProfile(userId) });
}

export async function PATCH(req: Request) {
  if (!auraFlags.enabled && process.env.MAPABLE_AURA_DEMO !== "true") {
    return NextResponse.json({ error: "MAPABLE_AURA_DISABLED" }, { status: 403 });
  }
  const body = (await req.json()) as {
    userId: string;
    mode: PresentationMode;
    symbolSet?: string;
  };
  setCommunicationProfile(body);
  return NextResponse.json({ profile: getCommunicationProfile(body.userId) });
}
