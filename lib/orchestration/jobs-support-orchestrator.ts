import { createEmploymentSupportBundle } from "@/lib/modules/employment-facade";

export async function createInterviewSupportDraft(
  applicationId: string,
  actorUserId: string,
) {
  return createEmploymentSupportBundle(applicationId, actorUserId);
}
