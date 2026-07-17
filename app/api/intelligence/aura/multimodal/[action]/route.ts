import { NextResponse } from "next/server";
import { z } from "zod";

import { auraFlags } from "@/lib/aura/feature-flags";
import { prepareMultimodalInput, processMultimodalInput } from "@/lib/aura/multimodal";

export const runtime = "nodejs";

const inputSchema = z.object({
  userId: z.string(),
  missionId: z.string().optional(),
  text: z.string().optional(),
  images: z
    .array(
      z.object({
        localReference: z.string(),
        retained: z.boolean(),
        locationMetadataIncluded: z.boolean(),
      }),
    )
    .optional(),
  requestedPurpose: z.enum([
    "ask_question",
    "identify_place_element",
    "record_observation",
    "describe_image",
    "create_route_note",
    "prepare_correction",
  ]),
  processingPreference: z.enum([
    "local_only",
    "local_preferred",
    "cloud_allowed",
    "no_ai",
  ]),
  createdAt: z.string(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ action: string }> },
) {
  if (!auraFlags.enabled && process.env.MAPABLE_AURA_DEMO !== "true") {
    return NextResponse.json({ error: "MAPABLE_AURA_DISABLED" }, { status: 403 });
  }
  const { action } = await ctx.params;
  try {
    const body = inputSchema.parse(await req.json());
    const multimodal = {
      missionId: body.missionId,
      text: body.text,
      images: body.images,
      requestedPurpose: body.requestedPurpose,
      processingPreference: body.processingPreference,
      createdAt: body.createdAt,
    };

    if (action === "prepare") {
      const prepared = prepareMultimodalInput({ ...multimodal, userId: body.userId });
      return NextResponse.json(prepared);
    }
    if (action === "process") {
      const candidates = processMultimodalInput({
        multimodal,
        userId: body.userId,
      });
      return NextResponse.json({ candidates });
    }
    return NextResponse.json({ error: "UNKNOWN_ACTION" }, { status: 404 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AURA_ERROR";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
