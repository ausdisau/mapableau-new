import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireApiPermission("verification:manage:any");
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");

  const verifications = await prisma.wwcVerification.findMany({
    where: status ? { status: status as never } : undefined,
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      workerProfile: { select: { id: true, displayName: true } },
      organisation: { select: { id: true, name: true } },
    },
  });

  return jsonOk({ verifications });
}
