import { requirePermission } from "@/lib/auth/guards";
import { getOrDraftWallet } from "@/lib/wallet/accounts";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function VaultWalletPage() {
  const user = await requirePermission("wallet:read:self");
  const wallet = await getOrDraftWallet(user.id);
  const keys = await prisma.walletKeyReference.findMany({
    where: { walletId: wallet.id, revokedAt: null },
  });
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="font-heading text-2xl font-bold">Your wallet</h1>
      <p className="rounded border-l-4 border-amber-500 bg-amber-50 p-3 text-sm">
        MapAble never auto-activates a wallet. You must explicitly opt in and
        confirm a recovery policy before any keys are issued.
      </p>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <dt>Status</dt>
        <dd>{wallet.activationStatus}</dd>
        <dt>Confirmed at</dt>
        <dd>
          {wallet.activationConfirmedAt
            ? wallet.activationConfirmedAt.toISOString()
            : "not yet"}
        </dd>
        <dt>Recovery policy</dt>
        <dd>{wallet.recoveryPolicyId ? "configured" : "not configured"}</dd>
        <dt>Active keys</dt>
        <dd>{keys.length}</dd>
      </dl>
    </div>
  );
}
