import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import {
  AccessGraphError,
  disputeAccessObservation,
} from "@/lib/access/infrastructure/observation-service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  notes: z.string().max(2000).optional(),
});

/**
 * POST /api/access-infrastructure/observations/:id/dispute
 * Correction path. Never promotes AI-inferred evidence to verified.
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }
    const { id } = await context.params;
    let notes: string | undefined;
    try {
      const json: unknown = await request.json();
      const parsed = bodySchema.safeParse(json);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid dispute payload" },
          { status: 400 },
        );
      }
      notes = parsed.data.notes;
    } catch {
      notes = undefined;
    }

    const observation = await disputeAccessObservation({
      id,
      actorUserId: session.user.id,
      notes,
    });
    return NextResponse.json({
      framework: "access_as_infrastructure",
      epic: "mapable-epic-01-access-graph",
      productionClaim: "none",
      claimState: "in_development",
      observation,
    });
  } catch (err) {
    if (err instanceof AccessGraphError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
