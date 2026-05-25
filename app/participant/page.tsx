import { MobileDashboard } from "@/components/dashboard/MobileDashboard";
import { requireAuth } from "@/lib/auth/guards";
import type { UserRole } from "@/types/mapable";

export const metadata = { title: "Home | MapAble" };

export default async function ParticipantHomePage() {
  const user = await requireAuth();
  return (
    <MobileDashboard
      role={user.primaryRole as UserRole}
      userName={user.name ?? "there"}
    />
  );
}
