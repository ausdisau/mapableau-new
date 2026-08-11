import type { CareRequest, CareShift } from "@prisma/client";

import { isCareAccessMatchingEnabled } from "@/lib/access/infrastructure/adapters/care";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { getWorkerBriefSliceForShift } from "@/lib/support/profile/support-profile-service";

export type WorkerParticipantView = {
  displayLabel: string;
  location?: string;
  tasks: unknown[];
  accessSummary?: string;
  communicationNotes?: string;
  /** Present when Access Infrastructure pre-shift disclosure was used. */
  disclosureReceiptId?: string;
  permittedAccessAttributes?: string[];
  supportProfileBrief?: Awaited<ReturnType<typeof getWorkerBriefSliceForShift>>;
};

type AccessSnapshot = {
  summary?: string;
  disclosureReceiptId?: string;
  permittedAttributes?: string[];
  permittedSummaryLines?: string[];
} | null;

export function filterParticipantInfoForWorker(
  user: CurrentUser,
  request: Pick<
    CareRequest,
    | "title"
    | "address"
    | "suburb"
    | "state"
    | "tasks"
    | "accessRequirementsSummary"
    | "communicationNotes"
    | "shareAccessibility"
  >,
  shift?: Pick<CareShift, "location" | "tasks" | "accessRequirementsSnapshot" | "id">
): WorkerParticipantView {
  const location =
    shift?.location ??
    [request.address, request.suburb, request.state].filter(Boolean).join(", ");

  const tasks = shift?.tasks ?? request.tasks ?? [];
  const accessSnapshot = shift?.accessRequirementsSnapshot as AccessSnapshot | undefined;

  // Access Infrastructure path: prefer purpose-limited disclosure receipt contents.
  if (
    isCareAccessMatchingEnabled() &&
    accessSnapshot?.disclosureReceiptId &&
    request.shareAccessibility
  ) {
    const summary =
      accessSnapshot.permittedSummaryLines?.join("; ") ||
      accessSnapshot.summary ||
      undefined;
    return {
      displayLabel: request.title,
      location: location || undefined,
      tasks: Array.isArray(tasks) ? tasks : [],
      accessSummary: summary,
      communicationNotes: request.communicationNotes ?? undefined,
      disclosureReceiptId: accessSnapshot.disclosureReceiptId,
      permittedAccessAttributes: accessSnapshot.permittedAttributes,
    };
  }

  return {
    displayLabel: request.title,
    location: location || undefined,
    tasks: Array.isArray(tasks) ? tasks : [],
    accessSummary: request.shareAccessibility
      ? accessSnapshot?.summary ?? request.accessRequirementsSummary ?? undefined
      : undefined,
    communicationNotes: request.communicationNotes ?? undefined,
  };
}

export async function buildWorkerParticipantView(
  user: CurrentUser,
  request: Parameters<typeof filterParticipantInfoForWorker>[1],
  shift?: Parameters<typeof filterParticipantInfoForWorker>[2]
): Promise<WorkerParticipantView> {
  const base = filterParticipantInfoForWorker(user, request, shift);
  if (!shift?.id) return base;
  const supportProfileBrief = await getWorkerBriefSliceForShift(shift.id);
  return { ...base, supportProfileBrief: supportProfileBrief ?? undefined };
}

export function filterParticipantInfoForProvider(
  request: Pick<
    CareRequest,
    | "title"
    | "description"
    | "address"
    | "tasks"
    | "accessRequirementsSummary"
    | "communicationNotes"
    | "shareAccessibility"
  >
) {
  return {
    title: request.title,
    description: request.description,
    address: request.address,
    tasks: request.tasks,
    accessRequirementsSummary: request.shareAccessibility
      ? request.accessRequirementsSummary
      : null,
    communicationNotes: request.communicationNotes,
  };
}

export function canViewFullParticipantCareProfile(user: CurrentUser): boolean {
  return (
    isAdminRole(user.primaryRole) ||
    user.primaryRole === "participant" ||
    user.primaryRole === "provider_admin" ||
    user.primaryRole === "support_coordinator" ||
    user.primaryRole === "plan_manager"
  );
}
