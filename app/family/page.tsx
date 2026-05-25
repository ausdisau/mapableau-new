import { FamilyDashboard } from "@/components/family/FamilyDashboard";
import { requireAuth } from "@/lib/auth/guards";
import { canAccessFamilyPortal } from "@/lib/access/role-policy";
import { listLinkedParticipantsForNominee } from "@/lib/family/nominee-service";
import { AccessDeniedPanel } from "@/components/shared/MapAbleModuleUi";

export default async function FamilyPortalPage() {
  const user = await requireAuth();

  if (!canAccessFamilyPortal(user.primaryRole)) {
    return (
      <div className="mx-auto max-w-5xl p-4 md:p-8">
        <AccessDeniedPanel message="This portal is for family supporters and nominees." />
      </div>
    );
  }

  const participants = await listLinkedParticipantsForNominee(user.id);

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <FamilyDashboard participants={participants} />
    </div>
  );
}
