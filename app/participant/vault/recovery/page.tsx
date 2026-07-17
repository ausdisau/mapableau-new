import { requirePermission } from "@/lib/auth/guards";
import { getOrDraftWallet } from "@/lib/wallet/accounts";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function VaultRecoveryPage() {
  const user = await requirePermission("wallet:recovery:self");
  const wallet = await getOrDraftWallet(user.id);
  const policy = wallet.recoveryPolicyId
    ? await prisma.walletRecoveryPolicy.findUnique({
        where: { id: wallet.recoveryPolicyId },
      })
    : null;
  const events = await prisma.walletRecoveryEvent.findMany({
    where: { walletId: wallet.id },
    orderBy: { requestedAt: "desc" },
  });
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="font-heading text-2xl font-bold">Wallet recovery</h1>
      <p className="rounded border-l-4 border-amber-500 bg-amber-50 p-3 text-sm">
        High-risk recovery flows require a human reviewer. AI cannot complete
        them.
      </p>
      <section>
        <h2 className="font-heading text-lg font-semibold">Policy</h2>
        {policy ? (
          <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <dt>Method</dt>
            <dd>{policy.method}</dd>
            <dt>Quorum</dt>
            <dd>{policy.quorum}</dd>
            <dt>Operator assist</dt>
            <dd>{policy.operatorAssistAllowed ? "yes" : "no"}</dd>
          </dl>
        ) : (
          <p className="text-sm">No policy set. Configure one before activating.</p>
        )}
      </section>
      <section>
        <h2 className="font-heading text-lg font-semibold">Recovery events</h2>
        {events.length === 0 ? (
          <p className="text-sm">No events.</p>
        ) : (
          <ul className="space-y-2">
            {events.map((e) => (
              <li key={e.id} className="rounded border p-3 text-sm">
                <div>Method: {e.method}</div>
                <div>Status: {e.status}</div>
                <div>Requested: {e.requestedAt.toISOString().slice(0, 10)}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
