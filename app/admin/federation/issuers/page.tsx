import { requireAdminScope } from "@/lib/auth/guards";
import { listIssuers } from "@/lib/identity-federation/issuers";

export const dynamic = "force-dynamic";

export default async function AdminFederationIssuersPage() {
  await requireAdminScope("federation:issuer:manage");
  const issuers = await listIssuers();
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="font-heading text-2xl font-bold">Federation issuers</h1>
      {issuers.length === 0 ? (
        <p className="text-sm">No issuers registered.</p>
      ) : (
        <ul className="space-y-2">
          {issuers.map((i) => (
            <li key={i.id} className="rounded border p-3 text-sm">
              <div className="font-medium">{i.displayName}</div>
              <div>Status: {i.status}</div>
              <div>Entity key: {i.entityKey}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
