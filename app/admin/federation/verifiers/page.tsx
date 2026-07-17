import { requireAdminScope } from "@/lib/auth/guards";
import { listVerifiers } from "@/lib/identity-federation/verifiers";

export const dynamic = "force-dynamic";

export default async function AdminFederationVerifiersPage() {
  await requireAdminScope("federation:verifier:manage");
  const verifiers = await listVerifiers();
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="font-heading text-2xl font-bold">Federation verifiers</h1>
      {verifiers.length === 0 ? (
        <p className="text-sm">No verifiers registered.</p>
      ) : (
        <ul className="space-y-2">
          {verifiers.map((v) => (
            <li key={v.id} className="rounded border p-3 text-sm">
              <div className="font-medium">{v.displayName}</div>
              <div>Status: {v.status}</div>
              <div>Entity key: {v.entityKey}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
