import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function VaultCredentialsPage() {
  const user = await requirePermission("credential:read:self");
  const credentials = await prisma.issuedCredential.findMany({
    where: { subjectId: user.id },
    include: { schema: true },
    orderBy: { createdAt: "desc" },
  });
  const offers = await prisma.credentialIssuanceOffer.findMany({
    where: { subjectId: user.id, status: "offered" },
    include: { schema: true },
  });
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="font-heading text-2xl font-bold">Your credentials</h1>
      <p className="rounded border-l-4 border-amber-500 bg-amber-50 p-3 text-sm">
        MapAble credentials are not government credentials. They are simulator
        only unless your operator has explicitly activated federation.
      </p>
      <section>
        <h2 className="font-heading text-lg font-semibold">Pending offers</h2>
        {offers.length === 0 ? (
          <p className="text-sm">No pending offers.</p>
        ) : (
          <ul className="space-y-2">
            {offers.map((o) => (
              <li key={o.id} className="rounded border p-3 text-sm">
                <div className="font-medium">{o.schema.displayName}</div>
                <div>Purpose: {o.purposeSummary}</div>
                <div>Mode: {o.mode}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="font-heading text-lg font-semibold">Issued credentials</h2>
        {credentials.length === 0 ? (
          <p className="text-sm">No credentials issued yet.</p>
        ) : (
          <ul className="space-y-2">
            {credentials.map((c) => (
              <li key={c.id} className="rounded border p-3 text-sm">
                <div className="font-medium">{c.schema.displayName}</div>
                <div>Simulator: {c.simulator ? "yes" : "no"}</div>
                <div>Issued: {c.issuedAt.toISOString().slice(0, 10)}</div>
                <div>Revoked: {c.revokedAt ? "yes" : "no"}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
