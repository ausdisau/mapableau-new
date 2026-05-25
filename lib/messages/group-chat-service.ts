import { createGroupThread } from "@/lib/messages/thread-service";
import type { CurrentUser } from "@/lib/auth/current-user";

export async function createGroupChat(params: {
  createdBy: CurrentUser;
  title: string;
  memberProfileIds: string[];
  memberDisplayNames: Record<string, string>;
  memberRoles?: Record<string, string>;
}) {
  const participants = params.memberProfileIds
    .filter((id) => id !== params.createdBy.id)
    .map((profileId) => ({
      profileId,
      role: params.memberRoles?.[profileId] ?? "member",
      displayName: params.memberDisplayNames[profileId] ?? "Member",
    }));

  return createGroupThread({
    createdBy: params.createdBy,
    title: params.title,
    participants,
  });
}
