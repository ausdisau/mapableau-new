import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function VaultPresentationsPage() {
  const user = await requirePermission("credential:present:self");
  const presentations = await prisma.credentialPresentation.findMany({
    where: { subjectId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="font-heading text-2xl font-bold">Presentations</h1>
      <p className="text-sm">
        Records of when your credentials were presented. Simulator status is
        shown so you can tell test vs live activity.
      </p>
      {presentations.length === 0 ? (
        <p className="text-sm">No presentations recorded.</p>
      ) : (
        <ul className="space-y-2">
          {presentations.map((p) => (
            <li key={p.id} className="rounded border p-3 text-sm">
              <div>Status: {p.status}</div>
              <div>Simulator: {p.simulator ? "yes" : "no"}</div>
              <div>When: {p.createdAt.toISOString()}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
