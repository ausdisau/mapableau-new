import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const relationships = await prisma.supportCoordinatorRelationship.findMany({
    where: { coordinatorId: user.id, status: "active" },
  });

  return jsonOk({ caseload: relationships });
}
