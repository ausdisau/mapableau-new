import type { CareRequest, CareShift } from "@prisma/client";

import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";

export type WorkerParticipantView = {
  displayLabel: string;
  location?: string;
  tasks: unknown[];
  accessSummary?: string;
  communicationNotes?: string;
};

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
  shift?: Pick<CareShift, "location" | "tasks" | "accessRequirementsSnapshot">
): WorkerParticipantView {
  const location =
    shift?.location ??
    [request.address, request.suburb, request.state].filter(Boolean).join(", ");

  const tasks = shift?.tasks ?? request.tasks ?? [];
  const accessSnapshot = shift?.accessRequirementsSnapshot as
    | { summary?: string }
    | null
    | undefined;

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
