import { requireAdmin } from "@/lib/auth/guards";
import { phase10Config } from "@/lib/config/phase10";
import { listCertificationApplications } from "@/lib/api-certification/certification-service";

export default async function ApiCertificationPage() {
  await requireAdmin();
  const apps = await listCertificationApplications();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">API certification</h1>
      {!phase10Config.apiCertificationProgramEnabled ? (
        <p className="text-amber-800">API_CERTIFICATION_PROGRAM_ENABLED is false.</p>
      ) : null}
      <ul className="space-y-2">
        {apps.map((a) => (
          <li key={a.id} className="rounded border p-3 text-sm">
            {a.appName} — {a.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
