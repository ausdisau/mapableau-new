import { NextResponse } from "next/server";

import {
  getDefaultSyntheticScene,
  submitVisionCandidateForShadowReview,
  visionAccessFlags,
} from "@/lib/vision-access";

export const dynamic = "force-dynamic";

/**
 * Submit a synthetic VisionAccess candidate into AI-Next shadow change review.
 * No public writes. No Twin overwrite. No camera.
 */
export async function POST(request: Request) {
  if (!visionAccessFlags.enabled && !visionAccessFlags.syntheticDemo) {
    return NextResponse.json(
      { error: "VisionAccess shadow review is disabled" },
      { status: 404 },
    );
  }

  let body: { candidateId?: string; subjectNodeId?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const scene = getDefaultSyntheticScene();
  const candidate =
    scene.candidates.find((c) => c.id === body.candidateId) ?? scene.candidates[0];
  if (!candidate) {
    return NextResponse.json({ error: "No synthetic candidate available" }, { status: 400 });
  }

  const review = submitVisionCandidateForShadowReview({
    candidate,
    subjectNodeId: body.subjectNodeId ?? "harbour_civic.entrance_west",
    previousValue: null,
    affectedRouteIds: ["harbour_civic.path_external"],
  });

  return NextResponse.json({
    mode: visionAccessFlags.mode,
    synthetic: true,
    productionClaim: "none",
    review,
    limitations: [
      "Vision candidate is provisional",
      "Not a certified measurement",
      "Not published automatically",
      "Verified Twin evidence was not overwritten",
    ],
  });
}
