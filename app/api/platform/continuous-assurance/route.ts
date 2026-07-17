import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { evaluateContinuousAssurance } from "@/lib/continuous-assurance/evaluator";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiPermission("platform:continuous-assurance:read");
  if (user instanceof Response) return user;
  const tenants = await prisma.organisation.findMany({
    select: { id: true, name: true, tenantStatus: true },
    take: 500,
  });
  const snapshots = await Promise.all(
    tenants.map(async (t) => ({
      ...t,
      snapshot: await evaluateContinuousAssurance(t.id),
    }))
  );
  return jsonOk({
    snapshots,
    disclaimer:
      "Snapshot only. Not a certification report. Feature flags do not equal assurance.",
  });
}
