import { requireAuth } from "@/lib/auth/guards";
import { isAdminRole } from "@/lib/auth/roles";
import { MessagesOverlayLauncher } from "@/components/messages/MessagesOverlayLauncher";

export async function DashboardMessagesOverlay() {
  const user = await requireAuth();
  const canEscalate =
    user.primaryRole === "participant" || isAdminRole(user.primaryRole);

  return (
    <MessagesOverlayLauncher
      currentProfileId={user.id}
      canEscalateSafety={canEscalate}
    />
  );
}
