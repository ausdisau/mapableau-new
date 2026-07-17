import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function VaultEmergencyPage() {
  const user = await requirePermission("vault:emergency:invoke:self");
  const requests = await prisma.emergencyAccessRequest.findMany({
    where: { subjectId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="font-heading text-2xl font-bold">Emergency access</h1>
      <p className="rounded border-l-4 border-amber-500 bg-amber-50 p-3 text-sm">
        Emergency access is time-bound and always reviewed by a human. AI
        cannot approve. Approved access auto-expires.
      </p>
      {requests.length === 0 ? (
        <p className="text-sm">No emergency access requests.</p>
      ) : (
        <ul className="space-y-2">
          {requests.map((r) => (
            <li key={r.id} className="rounded border p-3 text-sm">
              <div>Scope: {r.scope}</div>
              <div>Status: {r.status}</div>
              <div>When: {r.createdAt.toISOString()}</div>
              {r.expiresAt ? (
                <div>Expires: {r.expiresAt.toISOString()}</div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
