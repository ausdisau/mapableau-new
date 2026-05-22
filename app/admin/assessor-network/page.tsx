import { requireAdmin } from "@/lib/auth/guards";
import { getAssessorNetworkDirectory } from "@/lib/assessor-network/network-service";

export default async function AssessorNetworkPage() {
  await requireAdmin();
  const members = await getAssessorNetworkDirectory();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Assessor network</h1>
      <ul className="space-y-2">
        {members.map((m) => (
          <li key={m.id} className="rounded border p-3 text-sm">
            User {m.userId.slice(0, 8)} — {m.regions.join(", ") || "all regions"}
          </li>
        ))}
      </ul>
    </div>
  );
}
