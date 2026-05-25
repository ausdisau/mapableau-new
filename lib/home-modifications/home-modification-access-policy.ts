import type { UserRole } from "@/types/mapable";

import { assertHomeModificationAccess } from "./home-modification-service";

export async function canViewHomeModificationProject(params: {
  actorUserId: string;
  actorRole: UserRole;
  participantId: string;
  providerId?: string | null;
}): Promise<boolean> {
  return assertHomeModificationAccess(params);
}

export async function canViewHomePhotos(params: {
  actorUserId: string;
  actorRole: UserRole;
  participantId: string;
  uploadedById: string;
  visibility: string;
}): Promise<boolean> {
  if (params.actorUserId === params.participantId) return true;
  if (params.visibility === "private_to_participant") return false;

  return assertHomeModificationAccess({
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    participantId: params.participantId,
  });
}
