import { ZodError, z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  isWorkerCredentialMonitoringEnabled,
  isWorkerReadinessEnabled,
  isWorkforceEnabled,
} from "@/lib/config/connected-capability-flags";
import { prisma } from "@/lib/prisma";
import {
  computeWorkerReadiness,
  listExpiringCredentials,
} from "@/lib/workforce-os";
import { taylorSupportWorker } from "@/lib/workforce-os/taylor-worker";

const querySchema = z.object({
  fixture: z.enum(["taylor"]).optional(),
  workerProfileId: z.string().optional(),
  requiredCompetencies: z.string().optional(),
});

/**
 * GET worker readiness + credential expiry projection.
 * No automatic assignment. No quality score.
 */
export async function GET(req: Request) {
  if (!isWorkforceEnabled() || !isWorkerReadinessEnabled()) {
    return jsonError("MapAble Workforce readiness is not enabled", 503);
  }

  try {
    const url = new URL(req.url);
    const parsed = querySchema.parse({
      fixture: url.searchParams.get("fixture") ?? undefined,
      workerProfileId: url.searchParams.get("workerProfileId") ?? undefined,
      requiredCompetencies:
        url.searchParams.get("requiredCompetencies") ?? undefined,
    });

    if (parsed.fixture === "taylor") {
      const readiness = computeWorkerReadiness(taylorSupportWorker, {
        workerProfileId: taylorSupportWorker.workerProfileId,
        organisationId: taylorSupportWorker.organisationId,
        purpose: "care_transport_assignment_readiness",
        requiredCompetencies: taylorSupportWorker.requiredCompetencies,
        participantIntroductionRequired: true,
      });
      const expiring = isWorkerCredentialMonitoringEnabled()
        ? listExpiringCredentials(taylorSupportWorker)
        : [];
      return jsonOk({
        readiness,
        expiringCredentials: expiring,
        autoAssignment: false,
        qualityScore: null,
        productionClaimState: "synthetic",
      });
    }

    const user = await requireApiSession();
    if (user instanceof Response) return user;

    if (!parsed.workerProfileId) {
      return jsonError("workerProfileId is required", 400);
    }

    const profile = await prisma.workerProfile.findUnique({
      where: { id: parsed.workerProfileId },
      include: { trustCredentials: true },
    });
    if (!profile) return jsonError("Worker profile not found", 404);

    const requiredCompetencies = parsed.requiredCompetencies
      ? parsed.requiredCompetencies.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const readiness = computeWorkerReadiness(
      {
        workerProfileId: profile.id,
        organisationId: profile.organisationId,
        displayName: profile.displayName,
        workerScreeningStatus: profile.workerScreeningStatus,
        wwccStatus: profile.wwccStatus,
        firstAidStatus: profile.firstAidStatus,
        verificationStatus: profile.verificationStatus,
        highIntensityCompetencyVerified: profile.highIntensityCompetencyVerified,
        trustCredentials: profile.trustCredentials.map((c) => ({
          credentialType: c.credentialType,
          status: c.status,
          expiresAt: c.expiresAt,
        })),
        requiredCompetencies,
      },
      {
        workerProfileId: profile.id,
        organisationId: profile.organisationId,
        purpose: "assignment_readiness_projection",
        requiredCompetencies,
        participantIntroductionRequired: true,
      }
    );

    const expiring = isWorkerCredentialMonitoringEnabled()
      ? listExpiringCredentials({
          workerProfileId: profile.id,
          organisationId: profile.organisationId,
          workerScreeningStatus: profile.workerScreeningStatus,
          firstAidStatus: profile.firstAidStatus,
          trustCredentials: profile.trustCredentials.map((c) => ({
            credentialType: c.credentialType,
            status: c.status,
            expiresAt: c.expiresAt,
          })),
        })
      : [];

    return jsonOk({
      readiness,
      expiringCredentials: expiring,
      autoAssignment: false,
      qualityScore: null,
      productionClaimState: "internal_alpha",
    });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Readiness projection failed", 500);
  }
}
