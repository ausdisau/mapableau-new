import { MapAbleCard, MapAbleStatusBadge } from "@/components/shared/MapAbleModuleUi";
import { requirePermission } from "@/lib/auth/guards";
import { listReferralsForCoordinator } from "@/lib/support-coordination/referral-service";

export default async function SupportCoordinatorReferralsPage() {
  const user = await requirePermission("coordinator:portal");
  const referrals = await listReferralsForCoordinator(user.id);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <h1 className="font-heading text-2xl font-bold">Referrals</h1>
      <MapAbleCard description="Participant approval required before booking conversion">
        {referrals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No referrals yet.</p>
        ) : (
          <ul className="space-y-3">
            {referrals.map((r) => (
              <li key={r.id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-medium">{r.title}</h2>
                  <MapAbleStatusBadge status={r.status} />
                </div>
                {r.description ? (
                  <p className="mt-2 text-sm text-muted-foreground">{r.description}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </MapAbleCard>
    </div>
  );
}
