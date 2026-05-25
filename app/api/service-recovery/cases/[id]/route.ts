import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;

  const recoveryCase = await prisma.serviceRecoveryCase.findUnique({
    where: { id },
    include: {
      events: { orderBy: { createdAt: "asc" } },
      backupOptions: { orderBy: { createdAt: "asc" } },
      actions: { orderBy: { createdAt: "asc" } },
      escalations: true,
    },
  });

  if (!recoveryCase) return jsonError("Not found", 404);
  if (
    !isAdminRole(user.primaryRole) &&
    recoveryCase.participantId !== user.id &&
    recoveryCase.createdById !== user.id
  ) {
    return jsonError("Not found", 404);
  }

  return jsonOk({ recoveryCase });
}
