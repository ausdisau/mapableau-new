import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isRightsLedgerEnabled, isRightsOsEnabled } from "@/lib/rights-os/config";
import { getActiveAccess, revokeLease } from "@/lib/rights-os/ledger/ledger-service";

export async function GET() {
  if (!isRightsOsEnabled() || !isRightsLedgerEnabled()) {
    return jsonError("Rights ledger is not enabled", 404);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const access = await getActiveAccess(user.id);
  return jsonOk(access);
}

export async function POST(req: Request) {
  if (!isRightsOsEnabled() || !isRightsLedgerEnabled()) {
    return jsonError("Rights ledger is not enabled", 404);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = (await req.json()) as { leaseId?: string };
  if (!body.leaseId) {
    return jsonError("leaseId required", 400);
  }

  const { prisma } = await import("@/lib/prisma");
  const existing = await prisma.rightsCapabilityLease.findUnique({
    where: { id: body.leaseId },
  });

  if (!existing || existing.subjectUserId !== user.id) {
    return jsonError("Forbidden", 403);
  }

  const lease = await revokeLease(body.leaseId, user.id);

  return jsonOk({ lease, message: "Future access through MapAble has been stopped. Previously downloaded copies may not be technically recalled." });
}
