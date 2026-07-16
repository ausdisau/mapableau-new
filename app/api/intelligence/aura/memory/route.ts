import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createMemoryCard,
  listMemoryCards,
} from "@/lib/aura/memory";

export const runtime = "nodejs";

const bodySchema = z.object({
  userId: z.string(),
  title: z.string(),
  participantWording: z.string(),
  category: z.enum([
    "interaction",
    "explanation",
    "routing",
    "supporter_involvement",
    "notification",
    "privacy",
    "mission_workflow",
  ]),
  source: z.enum([
    "participant_authored",
    "participant_confirmed_suggestion",
    "imported_with_confirmation",
  ]),
  allowedModules: z.array(z.string()),
  structuredPreference: z
    .object({
      key: z.string(),
      value: z.union([
        z.boolean(),
        z.number(),
        z.string(),
        z.array(z.string()),
      ]),
    })
    .optional(),
});

export async function GET(req: Request) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "USER_ID_REQUIRED" }, { status: 400 });
  }
  return NextResponse.json({ cards: listMemoryCards(userId) });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }
  try {
    const result = createMemoryCard(parsed.data);
    return NextResponse.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AURA_ERROR";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
