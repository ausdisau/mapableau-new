import { ZodError } from "zod";

import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  getOrCreateWorkerProfileForUser,
  getPrimaryWorkerProfileForUser,
  updateWorkerProfileSelf,
} from "@/lib/workers/worker-profile-service";
import { workerProfileSelfSchema } from "@/lib/validation/worker";

function serializeProfile(
  profile: NonNullable<Awaited<ReturnType<typeof getPrimaryWorkerProfileForUser>>>
) {
  return {
    id: profile.id,
    displayName: profile.displayName,
    profileSummary: profile.profileSummary,
    serviceTypes: profile.serviceTypes,
    serviceRegions: profile.serviceRegions,
    specialisations: profile.specialisations,
    languages: profile.languages,
    communicationCapabilities: profile.communicationCapabilities,
    qualificationsSummary: profile.qualificationsSummary,
    workerScreeningStatus: profile.workerScreeningStatus,
    wwccStatus: profile.wwccStatus,
    firstAidStatus: profile.firstAidStatus,
    insuranceStatus: profile.insuranceStatus,
    verificationStatus: profile.verificationStatus,
    highIntensityCompetencyVerified: profile.highIntensityCompetencyVerified,
    active: profile.active,
    organisationId: profile.organisationId,
    organisation: profile.organisation,
    availabilityWindows: profile.availabilityWindows,
  };
}

export async function GET() {
  const user = await requireApiPermission("profile:read:self");
  if (user instanceof Response) return user;

  let profile = await getPrimaryWorkerProfileForUser(user.id);
  if (!profile && user.primaryRole === "support_worker") {
    profile = await getOrCreateWorkerProfileForUser(
      user.id,
      user.name ?? "Support worker"
    );
  }
  if (!profile) {
    return jsonError("No worker profile linked to your account", 404);
  }

  return jsonOk({ profile: serializeProfile(profile) });
}

export async function PATCH(req: Request) {
  const user = await requireApiPermission("profile:write:self");
  if (user instanceof Response) return user;

  try {
    const raw = await req.json();
    const parsed = workerProfileSelfSchema.parse(raw);

    const existing = await getPrimaryWorkerProfileForUser(user.id);
    if (!existing) {
      return jsonError("No worker profile linked to your account", 404);
    }

    const profile = await updateWorkerProfileSelf(
      existing.id,
      user.id,
      parsed
    );

    const full = await getPrimaryWorkerProfileForUser(user.id);
    return jsonOk({
      profile: full ? serializeProfile(full) : profile,
    });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    throw e;
  }
}
