import { AccessDeniedPanel } from "@/components/shared/MapAbleModuleUi";
import { EmergencyAccessPanel } from "@/components/family/EmergencyAccessPanel";
import { FamilyBookingDraftPanel } from "@/components/family/FamilyBookingDraftPanel";
import { SupportedDecisionLog } from "@/components/family/SupportedDecisionLog";
import { requireAuth } from "@/lib/auth/guards";
import { accessDeniedMessage } from "@/lib/access/role-policy";
import { getParticipantForNominee } from "@/lib/family/nominee-service";
import { listSupportedDecisionRecords } from "@/lib/family/supported-decision-service";

export default async function FamilyParticipantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;

  try {
    const data = await getParticipantForNominee({
      nomineeId: user.id,
      participantId: id,
    });
    const decisions = await listSupportedDecisionRecords({
      participantId: id,
      supporterId: user.id,
      limit: 10,
    });

    const permissions = (data.permissions as string[]) ?? [];
    const hasEmergency = permissions.includes("view_emergency_profile");

    return (
      <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
        <h1 className="font-heading text-2xl font-bold">Linked participant</h1>
        {data.documentsHidden ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
            {String(data.documentsMessage)}
          </p>
        ) : null}
        {permissions.includes("create_booking_draft") ? (
          <FamilyBookingDraftPanel participantId={id} />
        ) : null}
        <EmergencyAccessPanel
          hasPermission={hasEmergency}
          profile={
            hasEmergency
              ? (data.emergencyProfile as Record<string, unknown>)
              : null
          }
        />
        <SupportedDecisionLog records={decisions} />
      </div>
    );
  } catch {
    return (
      <div className="mx-auto max-w-5xl p-4 md:p-8">
        <AccessDeniedPanel message={accessDeniedMessage("no_link")} />
      </div>
    );
  }
}
