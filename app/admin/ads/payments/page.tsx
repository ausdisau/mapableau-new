import { requireAdmin } from "@/lib/auth/guards";
import { formatAudMicros } from "@/lib/ads/money/micros";
import { prisma } from "@/lib/prisma";

export default async function AdminAdsPaymentsPage() {
  await requireAdmin();
  const topUps = await prisma.adWalletTopUp.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { wallet: { include: { advertiser: true } } },
  });

  const deposits = topUps
    .filter((t) => t.status === "SUCCEEDED")
    .reduce((acc, t) => acc + t.amountMicros, 0n);
  const spend = await prisma.adBillingEvent.aggregate({
    where: { status: "CHARGED" },
    _sum: { chargedMicros: true },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <h1 className="text-2xl font-bold">Ads payments</h1>
      <p className="text-sm text-muted-foreground">
        Cash received (top-ups) is separate from advertising spend recognized.
        Do not treat prepaid deposits as revenue without accounting review. GST
        treatment requires Australian tax advice — not hard-coded here.
      </p>
      <dl className="grid gap-4 sm:grid-cols-2 text-sm">
        <div className="rounded-lg border border-border p-4">
          <dt className="text-muted-foreground">Gross advertiser deposits</dt>
          <dd className="text-xl font-bold">{formatAudMicros(deposits)}</dd>
        </div>
        <div className="rounded-lg border border-border p-4">
          <dt className="text-muted-foreground">Recognized ad spend</dt>
          <dd className="text-xl font-bold">
            {formatAudMicros(spend._sum.chargedMicros ?? 0n)}
          </dd>
        </div>
      </dl>
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Recent wallet top-ups</caption>
        <thead>
          <tr className="border-b">
            <th scope="col" className="py-2">
              When
            </th>
            <th scope="col" className="py-2">
              Advertiser
            </th>
            <th scope="col" className="py-2">
              Amount
            </th>
            <th scope="col" className="py-2">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {topUps.map((t) => (
            <tr key={t.id} className="border-b border-border/50">
              <td className="py-2">{t.createdAt.toISOString().slice(0, 19)}Z</td>
              <td className="py-2">{t.wallet.advertiser.name}</td>
              <td className="py-2">{formatAudMicros(t.amountMicros)}</td>
              <td className="py-2">{t.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
