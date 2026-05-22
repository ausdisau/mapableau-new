import { requireAdmin } from "@/lib/auth/guards";
import { phase12Config } from "@/lib/config/phase12";
import { listCertifiedApiEcosystem } from "@/lib/certified-api-ecosystem/ecosystem-service";

export default async function CertifiedApiEcosystemPage() {
  await requireAdmin();
  const data = await listCertifiedApiEcosystem();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Certified API ecosystem</h1>
      {data.disabled ? (
        <p>CERTIFIED_API_ECOSYSTEM_AT_SCALE_ENABLED is false.</p>
      ) : (
        <ul className="space-y-2">
          {data.entries.map((e) => (
            <li key={e.id} className="rounded border p-3 text-sm">
              {e.appName} — {e.certificationTier}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
