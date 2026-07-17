import { ZodError, z } from "zod";

import { exchangeLearningCompletion } from "@/lib/academy";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  isAcademyCompletionSyncEnabled,
  isAcademyEnabled,
} from "@/lib/config/connected-capability-flags";

const bodySchema = z.object({
  fixture: z.enum(["taylor"]).optional(),
  learnerUserId: z.string().optional(),
  workerProfileId: z.string().optional(),
  courseCode: z.string().optional(),
  courseTitle: z.string().optional(),
  competencyKey: z.string().optional(),
  includeAssessment: z.boolean().optional(),
  includeObservation: z.boolean().optional(),
});

/**
 * Learning completion exchange — never auto-certifies competency.
 */
export async function POST(req: Request) {
  if (!isAcademyEnabled() || !isAcademyCompletionSyncEnabled()) {
    return jsonError("Academy completion sync is not enabled", 503);
  }

  try {
    const body = bodySchema.parse(await req.json());

    if (body.fixture === "taylor") {
      const exchanged = exchangeLearningCompletion({
        completion: {
          id: "fixture-completion-aac",
          learnerUserId: "fixture-taylor-worker-user",
          courseCode: "COMM-AAC-101",
          courseTitle: "Communication and AAC essentials",
          completedAt: "2026-07-01T00:00:00.000Z",
          evidenceClass: "course_completion",
          provider: "mapable_academy",
          isSynthetic: true,
        },
        assessment: body.includeAssessment
          ? {
              id: "fixture-assessment-aac",
              learnerUserId: "fixture-taylor-worker-user",
              assessmentCode: "COMM-AAC-101-QUIZ",
              passed: true,
              evidenceClass: "assessment_passed",
              assessedAt: "2026-07-02T00:00:00.000Z",
              isSynthetic: true,
            }
          : null,
        observationEvidenceClasses: body.includeObservation
          ? ["supervisor_observed"]
          : [],
        competencyKey: "communication_aac",
        workerProfileId: "fixture-taylor-worker",
      });

      return jsonOk({
        ...exchanged,
        note: exchanged.competencyEvidence.competencyProved
          ? "Competency evidence sufficient for readiness input."
          : "Completion alone does not prove competency — human review required.",
        productionClaimState: "synthetic",
      });
    }

    const user = await requireApiSession();
    if (user instanceof Response) return user;

    const exchanged = exchangeLearningCompletion({
      completion: {
        id: `completion-${Date.now()}`,
        learnerUserId: body.learnerUserId ?? user.id,
        courseCode: body.courseCode ?? "UNKNOWN",
        courseTitle: body.courseTitle ?? "Untitled course",
        completedAt: new Date().toISOString(),
        evidenceClass: "course_completion",
        provider: "mapable_academy",
      },
      assessment: body.includeAssessment
        ? {
            id: `assessment-${Date.now()}`,
            learnerUserId: body.learnerUserId ?? user.id,
            assessmentCode: `${body.courseCode ?? "UNKNOWN"}-ASSESS`,
            passed: true,
            evidenceClass: "assessment_passed",
            assessedAt: new Date().toISOString(),
          }
        : null,
      observationEvidenceClasses: body.includeObservation
        ? ["supervisor_observed"]
        : [],
      competencyKey: body.competencyKey ?? "general",
      workerProfileId: body.workerProfileId ?? "unknown",
    });

    return jsonOk({
      ...exchanged,
      productionClaimState: "scaffold",
    });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Completion exchange failed", 500);
  }
}
