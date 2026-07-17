import { requireAdminScope } from "@/lib/auth/guards";
import { listActiveSchemas } from "@/lib/credentials/schemas";

export const dynamic = "force-dynamic";

export default async function AdminFederationSchemasPage() {
  await requireAdminScope("credential:schema:manage");
  const schemas = await listActiveSchemas();
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="font-heading text-2xl font-bold">Credential schemas</h1>
      <p className="rounded border-l-4 border-amber-500 bg-amber-50 p-3 text-sm">
        Government-credential schema names (NDISParticipantCredential,
        MedicalDiagnosisCredential, DisabilityCredential, etc.) are permanently
        blocked. MapAble is not a government issuer.
      </p>
      {schemas.length === 0 ? (
        <p className="text-sm">No schemas registered.</p>
      ) : (
        <ul className="space-y-2">
          {schemas.map((s) => (
            <li key={s.id} className="rounded border p-3 text-sm">
              <div className="font-medium">{s.displayName}</div>
              <div>Kind: {s.kind}</div>
              <div>Version: {s.version}</div>
              <div>Government: {s.isGovernment ? "yes" : "no"}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
