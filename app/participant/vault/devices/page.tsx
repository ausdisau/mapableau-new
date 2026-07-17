import { requirePermission } from "@/lib/auth/guards";
import { getOrDraftWallet } from "@/lib/wallet/accounts";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function VaultDevicesPage() {
  const user = await requirePermission("wallet:read:self");
  const wallet = await getOrDraftWallet(user.id);
  const devices = await prisma.walletDevice.findMany({
    where: { walletId: wallet.id },
    orderBy: { addedAt: "desc" },
  });
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="font-heading text-2xl font-bold">Your devices</h1>
      <p className="text-sm">Devices bound to your wallet.</p>
      {devices.length === 0 ? (
        <p className="text-sm">No devices registered yet.</p>
      ) : (
        <ul className="space-y-2">
          {devices.map((d) => (
            <li key={d.id} className="rounded border p-3 text-sm">
              <div className="font-medium">{d.deviceLabel}</div>
              <div>Trust: {d.trust}</div>
              <div>Platform: {d.platform ?? "unknown"}</div>
              <div>Added: {d.addedAt.toISOString().slice(0, 10)}</div>
              <div>Revoked: {d.revokedAt ? "yes" : "no"}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
