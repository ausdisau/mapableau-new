import { AgencyActivityList } from "@/components/personal-agency/AgencyActivityList";
import { listAgencyActivityForParticipant } from "@/lib/personal-agency/agency-activity-service";
import { requirePersonalAgencyGate } from "@/lib/personal-agency/gates";

export const metadata = { title: "Agency activity | My MapAble" };

export default async function AgencyActivityPage() {
  const user = await requirePersonalAgencyGate();
  const items = await listAgencyActivityForParticipant(user.id);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Agency activity</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          What happened, who initiated it, and whether anything was shared.
        </p>
      </header>
      <AgencyActivityList items={items} />
    </div>
  );
}
