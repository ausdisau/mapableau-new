import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { recordBanningOrderAssessment } from "@/lib/ndis-platform-trust/banning-orders/banning-service";
import { recordWorkerCredential } from "@/lib/ndis-platform-trust/credentials/credential-service";
import {
  assessWorkerPlatformEligibility,
  listWorkerEligibility,
} from "@/lib/ndis-platform-trust/eligibility/eligibility-service";

export const dynamic = "force-dynamic";

const postSchema = z.object({
  organisationId: z.string().min(1),
  workerUserId: z.string().min(1),
  clearanceStatus: z.enum([
    "not_started",
    "pending",
    "verified",
    "expired",
    "revoked",
    "self_declared",
    "source_unavailable",
  ]),
  banningStatus: z.enum([
    "not_checked",
    "clear",
    "match_found",
    "inconclusive",
    "source_unavailable",
  ]),
  banningSourceLabel: z.string().min(1).optional(),
  credentialType: z.string().optional(),
  credentialVerificationStatus: z
    .enum([
      "self_declared",
      "document_on_file",
      "externally_verified",
      "expired",
      "revoked",
      "rejected",
    ])
    .optional(),
});

export async function GET(req: Request) {
  const user = await requireApiPermission("platform_trust:workers:read");
  if (user instanceof Response) return user;
  const url = new URL(req.url);
  const organisationId = url.searchParams.get("organisationId");
  if (!organisationId) return jsonError("organisationId required", 400);
  const assessments = await listWorkerEligibility(organisationId);
  return jsonOk({
    assessments: assessments.map((a) => ({
      id: a.id,
      workerUserId: a.workerUserId,
      status: a.status,
      clearanceStatus: a.clearanceStatus,
      banningStatus: a.banningStatus,
      blocksPlatformWork: a.blocksPlatformWork,
      rationale: a.rationale,
      assessedAt: a.assessedAt,
    })),
    disclaimer: "No identity documents or secrets are returned.",
  });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("platform_trust:workers:assess");
  if (user instanceof Response) return user;
  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  await recordBanningOrderAssessment({
    organisationId: parsed.data.organisationId,
    workerUserId: parsed.data.workerUserId,
    status: parsed.data.banningStatus,
    sourceLabel: parsed.data.banningSourceLabel ?? "provider_manual",
    checkedById: user.id,
  });

  if (parsed.data.credentialType) {
    await recordWorkerCredential({
      organisationId: parsed.data.organisationId,
      workerUserId: parsed.data.workerUserId,
      credentialType: parsed.data.credentialType,
      verificationStatus: parsed.data.credentialVerificationStatus ?? "self_declared",
      verifiedById: user.id,
    });
  }

  const assessment = await assessWorkerPlatformEligibility({
    organisationId: parsed.data.organisationId,
    workerUserId: parsed.data.workerUserId,
    clearanceStatus: parsed.data.clearanceStatus,
    banningStatus: parsed.data.banningStatus,
    assessedById: user.id,
  });

  return jsonOk({
    assessment: {
      id: assessment.id,
      status: assessment.status,
      blocksPlatformWork: assessment.blocksPlatformWork,
      rationale: assessment.rationale,
    },
  });
}
