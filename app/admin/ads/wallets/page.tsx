import { requireAdmin } from "@/lib/auth/guards";
import { formatAudMicros } from "@/lib/ads/money/micros";
import { prisma } from "@/lib/prisma";
import { AdminWalletAdjustForm } from "@/app/admin/ads/wallets/adjust-form";

export default async function AdminAdsWalletsPage() {
  await requireAdmin();
  const wallets = await prisma.adWallet.findMany({
    include: { advertiser: true },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <h1 className="text-2xl font-bold">Advertiser wallets</h1>
      <p className="text-sm text-muted-foreground">
        Manual adjustments require an admin reason and write an audit event.
        Never silently change balances.
      </p>
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Ad wallets</caption>
        <thead>
          <tr className="border-b">
            <th scope="col" className="py-2">
              Advertiser
            </th>
            <th scope="col" className="py-2">
              Status
            </th>
            <th scope="col" className="py-2">
              Balance
            </th>
            <th scope="col" className="py-2">
              Wallet id
            </th>
          </tr>
        </thead>
        <tbody>
          {wallets.map((w) => (
            <tr key={w.id} className="border-b border-border/50">
              <td className="py-2">{w.advertiser.name}</td>
              <td className="py-2">
                <span
                  className={
                    w.status === "FROZEN" ? "font-semibold text-destructive" : undefined
                  }
                >
                  {w.status}
                </span>
              </td>
              <td className="py-2">{formatAudMicros(w.availableMicros)}</td>
              <td className="py-2 font-mono text-xs">{w.id}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <AdminWalletAdjustForm />
    </div>
  );
}
