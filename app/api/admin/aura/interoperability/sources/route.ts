import { NextResponse } from "next/server";
import { z } from "zod";

import { auraFlags } from "@/lib/aura/feature-flags";
import {
  listSources,
  registerSource,
  startImport,
  getImport,
} from "@/lib/aura/interoperability";

export const runtime = "nodejs";

export async function GET() {
  if (!auraFlags.enabled && process.env.MAPABLE_AURA_DEMO !== "true") {
    return NextResponse.json({ error: "MAPABLE_AURA_DISABLED" }, { status: 403 });
  }
  return NextResponse.json({ sources: listSources() });
}

const sourceSchema = z.object({
  type: z.enum([
    "gtfs_schedule",
    "gtfs_realtime",
    "indoorgml",
    "curb",
    "sensorthings",
    "wot_thing_description",
    "manual",
    "partner_api",
  ]),
  name: z.string(),
  organisationId: z.string().optional(),
  sourceUrl: z.string().optional(),
  trustState: z.enum(["approved", "pilot", "quarantined", "disabled"]),
  freshnessPolicyId: z.string(),
  enabled: z.boolean(),
});

export async function POST(req: Request) {
  if (!auraFlags.enabled && process.env.MAPABLE_AURA_DEMO !== "true") {
    return NextResponse.json({ error: "MAPABLE_AURA_DISABLED" }, { status: 403 });
  }
  try {
    const body = sourceSchema.parse(await req.json());
    const source = registerSource(body);
    return NextResponse.json({ source });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AURA_ERROR";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
