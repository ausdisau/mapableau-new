import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import { loadPilotScoped } from "@/lib/pilot/api/access";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ pilotId: string }> };

/** GET /api/admin/pilots/[pilotId]/workers — no credential findings exposed */
export async function GET(_req: Request, { params }: Params) {
  const user = await requireApiPermission("pilot:view");
  if (user instanceof Response) return user;

  const { pilotId } = await params;
  const pilot = await loadPilotScoped(user, pilotId);
  if (pilot instanceof Response) return pilot;

  const workers = await prisma.pilotWorkerAuthorisation.findMany({
    where: { pilotId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      workerUserId: true,
      active: true,
      authorisedById: true,
      revokedAt: true,
      revokeReason: true,
      createdAt: true,
      updatedAt: true,
      workerUser: { select: { id: true, name: true, email: true } },
    },
  });

  return jsonNdisOk({
    pilotId,
    workers: workers.map((w) => ({
      id: w.id,
      workerUserId: w.workerUserId,
      displayName: w.workerUser.name,
      email: w.workerUser.email,
      active: w.active,
      authorisedById: w.authorisedById,
      revokedAt: w.revokedAt?.toISOString() ?? null,
      revokeReason: w.revokeReason,
      createdAt: w.createdAt.toISOString(),
      updatedAt: w.updatedAt.toISOString(),
      // credentialChecksJson intentionally omitted — restricted findings
    })),
  });
}
