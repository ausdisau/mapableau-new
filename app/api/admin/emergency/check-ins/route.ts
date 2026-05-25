import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiPermission("emergency:manage:any");
  if (user instanceof Response) return user;
  const checkIns = await prisma.emergencyCheckIn.findMany({
    where: { escalated: true },
    include: {
      participant: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return jsonOk({ checkIns });
}
