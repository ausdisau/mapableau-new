import { DEFAULT_PLACEMENT_FLOOR_CPM_MICROS } from "@/lib/ads/auction/config";
import { getPlacementReservePrice } from "@/lib/ads/auction/reserves";
import { microsToString } from "@/lib/ads/money/micros";
import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const rules = await prisma.adPlacementRule.findMany({
    where: { ruleKey: "floor_cpm_micros" },
    include: { placement: true },
  });
  const byCode = Object.fromEntries(
    rules.map((r) => [r.placement.code, r.ruleValue]),
  );

  const floors = Object.entries(DEFAULT_PLACEMENT_FLOOR_CPM_MICROS).map(
    ([code, def]) => {
      const resolved = getPlacementReservePrice(code, {
        ruleFloorCpmMicros: byCode[code],
      });
      return {
        placementCode: code,
        floorCpmMicros: microsToString(resolved.floorCpmMicros),
        defaultMicros: microsToString(def),
        source: resolved.source,
      };
    },
  );

  return jsonOk({ floors });
}
