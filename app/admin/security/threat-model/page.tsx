import { requireAdmin } from "@/lib/auth/guards";
import { listThreatModelItems } from "@/lib/security/threat-model-service";

export const metadata = { title: "Threat model | Admin" };

export default async function ThreatModelPage() {
  await requireAdmin();
  const items = await listThreatModelItems();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Threat model</h1>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="p-2">Category</th>
            <th className="p-2">Threat</th>
            <th className="p-2">Mitigation</th>
          </tr>
        </thead>
        <tbody>
          {items.map((t) => (
            <tr key={t.id} className="border-b">
              <td className="p-2">{t.category}</td>
              <td className="p-2">{t.threat}</td>
              <td className="p-2">{t.mitigation ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
