import { NextResponse } from "next/server";
import { z } from "zod";

import {
  filterPublishableApproachCandidates,
  listSyntheticCivicApproachCandidates,
  reviewApproachCandidate,
} from "@/lib/spatial/approach-resolver";
import { accessAddressIntelligenceFlags } from "@/lib/spatial/flags";

const postBodySchema = z.object({
  action: z.enum(["list", "review"]).default("list"),
  includeInferred: z.boolean().optional().default(true),
  candidateId: z.string().trim().min(1).max(200).optional(),
  decision: z.enum(["confirmed", "rejected", "needs_more_evidence"]).optional(),
  reviewer: z.string().trim().min(1).max(120).optional(),
  reviewerRole: z.enum(["participant", "venue", "staff", "mapper"]).optional(),
  note: z.string().trim().max(500).optional(),
});

type RouteContext = { params: Promise<{ placeId: string }> };

/**
 * Entrance / drop-off approach candidates for a place.
 * Synthetic civic pilot for harbour_civic; no public auto-publish of inferred rows.
 */
export async function POST(request: Request, context: RouteContext) {
  const { placeId } = await context.params;

  if (
    !accessAddressIntelligenceFlags.entranceResolverEnabled &&
    !accessAddressIntelligenceFlags.dropOffResolverEnabled
  ) {
    return NextResponse.json(
      {
        error: "Entrance / drop-off resolver is disabled.",
        code: "APPROACH_RESOLVER_DISABLED",
      },
      { status: 404 },
    );
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = postBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (placeId !== "harbour_civic") {
    return NextResponse.json(
      {
        error: "Only the synthetic harbour_civic pilot is available in this wave.",
        code: "PLACE_NOT_IN_PILOT",
      },
      { status: 404 },
    );
  }

  const all = listSyntheticCivicApproachCandidates();

  if (parsed.data.action === "review") {
    if (!parsed.data.candidateId || !parsed.data.decision || !parsed.data.reviewer || !parsed.data.reviewerRole) {
      return NextResponse.json(
        {
          error: "review requires candidateId, decision, reviewer, and reviewerRole",
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      );
    }
    const existing = all.find((c) => c.candidateId === parsed.data.candidateId);
    if (!existing) {
      return NextResponse.json(
        { error: "Candidate not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }
    const reviewed = reviewApproachCandidate(existing, {
      decision: parsed.data.decision,
      reviewer: parsed.data.reviewer,
      reviewerRole: parsed.data.reviewerRole,
      note: parsed.data.note,
    });
    return NextResponse.json({
      candidate: reviewed,
      publishable: filterPublishableApproachCandidates([reviewed]),
      productionClaim: "none",
      note: "Review is ephemeral in this wave — persistence lands with AccessPlace evidence writers.",
    });
  }

  const candidates = parsed.data.includeInferred
    ? all
    : filterPublishableApproachCandidates(all);

  return NextResponse.json({
    placeId,
    candidates,
    publishable: filterPublishableApproachCandidates(all),
    productionClaim: "none",
    limitations: [
      "Inferred candidates are never published as accessible by default.",
      "Venue confirmation does not override participant reports.",
      "Private-home entrances are never publicly listed.",
      "No routing claim without separate route evidence.",
    ],
  });
}
