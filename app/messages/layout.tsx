import { MapAbleRoleAppShell } from "@/components/layout/MapAbleRoleAppShell";
import { MessagesNav } from "@/components/layout/MessagesNav";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <MapAbleRoleAppShell headerTitle="Messages" secondaryNav={<MessagesNav />}>
      {children}
    </MapAbleRoleAppShell>
  );
}
