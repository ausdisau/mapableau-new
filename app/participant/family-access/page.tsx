import { MapAbleCard } from "@/components/shared/MapAbleModuleUi";
import { FamilyPermissionSelector } from "@/components/family/FamilyPermissionSelector";
import { NomineeInvitationForm } from "@/components/family/NomineeInvitationForm";
import { requireAuth } from "@/lib/auth/guards";
import { listNomineeLinksForParticipant } from "@/lib/family/nominee-service";
import type { NomineePermissionScope } from "@prisma/client";

export default async function ParticipantFamilyAccessPage() {
  const user = await requireAuth();
  const links = await listNomineeLinksForParticipant(user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4 md:p-8">
      <header>
        <h1 className="font-heading text-2xl font-bold">Family & nominee access</h1>
        <p className="mt-2 text-muted-foreground">
          You control who has access and what they can do. Permissions are granular and revocable.
        </p>
      </header>

      <NomineeInvitationForm />

      <MapAbleCard title="Who has access">
        {links.length === 0 ? (
          <p className="text-sm text-muted-foreground">No family supporters linked yet.</p>
        ) : (
          <ul className="space-y-4">
            {links.map((link) => (
              <li key={link.id}>
                <p className="font-medium">Supporter · {link.status}</p>
                <FamilyPermissionSelector
                  linkId={link.id}
                  selected={link.permissions.map((p) => p.scope as NomineePermissionScope)}
                  readOnly
                />
              </li>
            ))}
          </ul>
        )}
      </MapAbleCard>
    </div>
  );
}
