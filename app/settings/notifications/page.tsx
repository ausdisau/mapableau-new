import { NotificationSettingsClient } from "@/components/notifications/NotificationSettingsClient";
import { OfflineActionQueue } from "@/components/offline/OfflineActionQueue";
import { requireAuth } from "@/lib/auth/guards";

export const metadata = { title: "Notification settings | MapAble" };

export default async function NotificationSettingsPage() {
  await requireAuth();

  return (
    <div className="mx-auto max-w-lg space-y-8 px-4 py-8">
      <header>
        <h1 className="font-heading text-2xl font-bold">Notifications</h1>
        <p className="text-sm text-muted-foreground">
          MapAble never asks for notification permission on first load. Enable
          push only when you choose to.
        </p>
      </header>
      <NotificationSettingsClient />
      <OfflineActionQueue />
    </div>
  );
}
