import { ZodError } from "zod";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isPlatformAssuranceEnabled } from "@/lib/config/platform-assurance";
import {
  createScopeAssessment,
  createScopeAssessmentSchema,
  listScopeAssessments,
} from "@/lib/platform-assurance";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  if (!isPlatformAssuranceEnabled()) {
    return jsonError("PLATFORM_ASSURANCE_DISABLED", 403);
  }

  const assessments = await listScopeAssessments();
  return jsonOk({ assessments });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  if (!isPlatformAssuranceEnabled()) {
    return jsonError("PLATFORM_ASSURANCE_DISABLED", 403);
  }

  try {
    const body = await req.json();
    const input = createScopeAssessmentSchema.parse(body);
    // First PR: admins are assurance officers, not legal reviewers.
    const assessment = await createScopeAssessment({
      input,
      actorUserId: user.id,
      isLegalReviewer: false,
    });
    return jsonOk({ assessment }, 201);
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    if (error instanceof Error) {
      if (error.message === "REGULATORY_SOURCE_NOT_FOUND") {
        return jsonError(error.message, 404);
      }
      if (error.message === "LEGAL_REVIEWER_REQUIRED_FOR_SCOPE_OPINION") {
        return jsonError(error.message, 403);
      }
    }
    return jsonError("SCOPE_ASSESSMENT_CREATE_FAILED", 500);
  }
}
