import { RosterCalendar } from "@/components/admin-panels/provider/RosterCalendar";
import { requireProviderPanel } from "@/lib/auth/panel-guards";
import { listCareShiftsAsRoster } from "@/lib/providers/roster-service";
import { resolveProviderOrganisationId } from "@/lib/providers/provider-service";

export const metadata = { title: "Roster | Provider admin" };

export default async function ProviderRosterPage() {
  const user = await requireProviderPanel();
  const orgId = await resolveProviderOrganisationId(user);
  const shifts = await listCareShiftsAsRoster(user, orgId);
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Roster</h1>
      <RosterCalendar shifts={shifts} />
    </div>
  );
}
