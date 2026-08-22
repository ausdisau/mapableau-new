import { requireAdmin } from "@/lib/auth/guards";
import { formatAudMicros } from "@/lib/ads/money/micros";
import { prisma } from "@/lib/prisma";

export default async function AdminAdsLedgerPage() {
  await requireAdmin();
  const entries = await prisma.adWalletLedgerEntry.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <h1 className="text-2xl font-bold">Ads wallet ledger</h1>
      <p className="text-sm text-muted-foreground">
        Append-only. Corrections are compensating entries — historical rows are
        never rewritten.
      </p>
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Ledger entries</caption>
        <thead>
          <tr className="border-b">
            <th scope="col" className="py-2">
              When
            </th>
            <th scope="col" className="py-2">
              Type
            </th>
            <th scope="col" className="py-2">
              Amount
            </th>
            <th scope="col" className="py-2">
              Balance after
            </th>
            <th scope="col" className="py-2">
              Source
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id} className="border-b border-border/50">
              <td className="py-2">{e.createdAt.toISOString().slice(0, 19)}Z</td>
              <td className="py-2">{e.type}</td>
              <td className="py-2">{formatAudMicros(e.amountMicros)}</td>
              <td className="py-2">
                {e.balanceAfterMicros != null
                  ? formatAudMicros(e.balanceAfterMicros)
                  : "—"}
              </td>
              <td className="py-2 font-mono text-xs">
                {e.sourceType}:{e.sourceId ?? ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
