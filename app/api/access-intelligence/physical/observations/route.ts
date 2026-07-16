import { z } from "zod";

import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { physicalErrorResponse } from "@/lib/access-intelligence/physical/api-helpers";
import { recordMetric } from "@/lib/access-intelligence/physical/observability";
import {
  getScoutCandidates,
  listScoutFixtureIds,
} from "@/lib/access-intelligence/physical/scout/candidates";
import { getHarbourPhysicalSimulator } from "@/lib/access-intelligence/physical/simulator/harbour-simulator";

export async function GET(request: Request) {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    const url = new URL(request.url);
    const fixtureId = url.searchParams.get("fixtureId");
    if (fixtureId) {
      return Response.json({
        fixtureId,
        candidates: getScoutCandidates(fixtureId),
        notice:
          "Perception candidates are provisional, simulated, and excluded from verified measurements until human confirmation.",
      });
    }
    const state = getHarbourPhysicalSimulator().getState();
    return Response.json({
      fixtures: listScoutFixtureIds(),
      observations: state.observations,
      notice:
        "Scout uses labelled fixtures only. Uncalibrated images cannot establish exact widths or gradients.",
    });
  } catch (error) {
    return physicalErrorResponse(error);
  }
}

const reviewSchema = z.object({
  fixtureId: z.string().min(1),
  candidateId: z.string().min(1),
  decision: z.enum(["accept", "edit", "reject"]),
  editedLabel: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    const parsed = reviewSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        {
          error: "Invalid observation review payload.",
          code: "VALIDATION_ERROR",
          recoveryHint: "Provide fixtureId, candidateId, and decision.",
        },
        { status: 400 },
      );
    }
    const candidates = getScoutCandidates(parsed.data.fixtureId);
    const candidate = candidates.find((c) => c.id === parsed.data.candidateId);
    if (!candidate) {
      return Response.json(
        {
          error: "Candidate not found.",
          code: "VALIDATION_ERROR",
          recoveryHint: "Reload Scout fixtures and try again.",
        },
        { status: 404 },
      );
    }
    recordMetric("physical_scout_review", {
      decision: parsed.data.decision,
      category: candidate.category,
    });
    return Response.json({
      status: "recorded",
      decision: parsed.data.decision,
      candidate: {
        ...candidate,
        label: parsed.data.editedLabel ?? candidate.label,
      },
      measurementClaim: false,
      notice:
        "Accepted candidates remain provisional community observations — not calibrated measurements.",
      moderated: true,
      reviewedBy: userId,
      notes: parsed.data.notes,
    });
  } catch (error) {
    return physicalErrorResponse(error);
  }
}
