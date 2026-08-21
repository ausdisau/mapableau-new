import { requireAdmin } from "@/lib/auth/guards";
import { DEFAULT_PLACEMENT_FLOOR_CPM_MICROS } from "@/lib/ads/auction/config";
import { getPlacementReservePrice } from "@/lib/ads/auction/reserves";
import { formatAudMicros } from "@/lib/ads/money/micros";
import { prisma } from "@/lib/prisma";

export default async function AdminAdsPricingPage() {
  await requireAdmin();
  const rules = await prisma.adPlacementRule.findMany({
    where: { ruleKey: "floor_cpm_micros" },
    include: { placement: true },
  });
  const byCode = Object.fromEntries(
    rules.map((r) => [r.placement.code, r.ruleValue]),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <h1 className="text-2xl font-bold">Placement reserve prices</h1>
      <p className="text-sm text-muted-foreground">
        Floors are operator-configurable via placement rules (
        <code>floor_cpm_micros</code>). Changing floors does not alter
        accessibility ranking, provider suitability, or organic results.
      </p>
      <table className="w-full text-left text-sm">
        <caption className="sr-only">CPM reserve floors by placement</caption>
        <thead>
          <tr className="border-b">
            <th scope="col" className="py-2">
              Placement
            </th>
            <th scope="col" className="py-2">
              Floor CPM
            </th>
            <th scope="col" className="py-2">
              Source
            </th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(DEFAULT_PLACEMENT_FLOOR_CPM_MICROS).map((code) => {
            const resolved = getPlacementReservePrice(code, {
              ruleFloorCpmMicros: byCode[code],
            });
            return (
              <tr key={code} className="border-b border-border/50">
                <td className="py-2 font-mono text-xs">{code}</td>
                <td className="py-2">
                  {formatAudMicros(resolved.floorCpmMicros)}
                </td>
                <td className="py-2">{resolved.source}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
