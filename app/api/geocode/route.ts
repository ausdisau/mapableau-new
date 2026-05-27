import { NextResponse } from "next/server";
import { z } from "zod";

import { geocodeAddress } from "@/lib/map/geocoding-service";

const querySchema = z.object({
  q: z.string().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(10).optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    q: searchParams.get("q") ?? "",
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const results = await geocodeAddress(parsed.data.q, {
    limit: parsed.data.limit,
  });

  return NextResponse.json({ results });
}
