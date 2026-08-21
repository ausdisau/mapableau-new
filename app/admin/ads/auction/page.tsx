import { requireAdmin } from "@/lib/auth/guards";
import { formatAudMicros } from "@/lib/ads/money/micros";
import { prisma } from "@/lib/prisma";

export default async function AdminAdsAuctionPage() {
  await requireAdmin();
  const auctions = await prisma.adAuctionResult.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <h1 className="text-2xl font-bold">Auction outcomes</h1>
      <p className="text-sm text-muted-foreground">
        Immutable audit records. No participant, disability, or NDIS fields are
        stored.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <caption className="sr-only">Recent auction results</caption>
          <thead>
            <tr className="border-b">
              <th scope="col" className="py-2 pr-2">
                When
              </th>
              <th scope="col" className="py-2 pr-2">
                Placement
              </th>
              <th scope="col" className="py-2 pr-2">
                Winner
              </th>
              <th scope="col" className="py-2 pr-2">
                Model
              </th>
              <th scope="col" className="py-2 pr-2">
                Reserve
              </th>
              <th scope="col" className="py-2 pr-2">
                Clearing eCPM
              </th>
              <th scope="col" className="py-2">
                Unit price
              </th>
            </tr>
          </thead>
          <tbody>
            {auctions.map((a) => (
              <tr key={a.id} className="border-b border-border/50">
                <td className="py-2 pr-2">
                  {a.createdAt.toISOString().slice(0, 19)}Z
                </td>
                <td className="py-2 pr-2">{a.placementCode}</td>
                <td className="py-2 pr-2 font-mono text-xs">
                  {a.winnerCampaignId ?? "—"}
                </td>
                <td className="py-2 pr-2">{a.winnerBidModel ?? "—"}</td>
                <td className="py-2 pr-2">
                  {formatAudMicros(a.reservePriceMicros)}
                </td>
                <td className="py-2 pr-2">
                  {a.clearingEcpmMicros
                    ? formatAudMicros(a.clearingEcpmMicros)
                    : "—"}
                </td>
                <td className="py-2">
                  {a.clearingUnitPriceMicros
                    ? formatAudMicros(a.clearingUnitPriceMicros)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
