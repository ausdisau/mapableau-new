import { requireParticipantSelf } from "@/lib/auth/guards";
import { getParticipantDataAccessHistory } from "@/lib/audit/data-access-log-service";
import { DataAccessLogTable } from "@/components/admin/DataAccessLogTable";

export const metadata = { title: "Data access history | MapAble" };

export default async function ParticipantDataAccessHistoryPage() {
  const user = await requireParticipantSelf();
  const logs = await getParticipantDataAccessHistory(user.id);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Who accessed my data</h1>
        <p className="mt-1 text-muted-foreground">
          Transparency log of when your information was viewed on MapAble.
        </p>
      </header>
      <DataAccessLogTable logs={logs} />
    </div>
  );
}
