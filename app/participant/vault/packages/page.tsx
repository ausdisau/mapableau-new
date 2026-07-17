import { requirePermission } from "@/lib/auth/guards";
import { listPackagesForParticipant, classifyPortability } from "@/lib/access-vault/packages";

export const dynamic = "force-dynamic";

export default async function VaultPackagesPage() {
  const user = await requirePermission("vault:package:read:self");
  const packages = await listPackagesForParticipant(user.id);
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="font-heading text-2xl font-bold">Your data packages</h1>
      <p className="text-sm">
        Packages summarise information MapAble holds about you. They never
        contain raw clinical data.
      </p>
      {packages.length === 0 ? (
        <p className="text-sm">No packages yet.</p>
      ) : (
        <ul className="space-y-2">
          {packages.map((p) => (
            <li key={p.id} className="rounded border p-3 text-sm">
              <div className="font-medium">{p.displayName}</div>
              <div>Category: {p.category}</div>
              <div>Classification: {p.classification}</div>
              <div>Portability: {classifyPortability(p)}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
