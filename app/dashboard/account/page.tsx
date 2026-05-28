import { AccountsCentreClient } from "@/components/account/AccountsCentreClient";
import { requireAccountAccess } from "@/lib/auth/guards";
import { ensureDefaultPreferences } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Accounts centre | MapAble Core" };

export default async function AccountsCentrePage() {
  const user = await requireAccountAccess();
  await ensureDefaultPreferences(user.id);
  const preferences = await prisma.notificationPreference.findMany({
    where: { userId: user.id },
  });

  return (
    <AccountsCentreClient
      initialNotificationPrefs={preferences.map((p) => ({
        category: p.category,
        channel: p.channel,
        enabled: p.enabled,
      }))}
    />
  );
}
