import Link from "next/link";

import { EmergencyProfileForm } from "@/components/emergency/EmergencyProfileForm";
import { requirePermission } from "@/lib/auth/guards";
import { getEmergencyProfile } from "@/lib/emergency/profile-service";

export default async function EmergencyProfilePage() {
  const user = await requirePermission("emergency:manage:self");
  const profile = await getEmergencyProfile(user.id);

  return (
    <div className="space-y-6">
      <Link href="/dashboard/emergency" className="text-sm text-primary underline">
        ← Emergency
      </Link>
      <h1 className="font-heading text-2xl font-bold">Emergency profile</h1>
      <EmergencyProfileForm initial={profile ?? undefined} />
    </div>
  );
}
