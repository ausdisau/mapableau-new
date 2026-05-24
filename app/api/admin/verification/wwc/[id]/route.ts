import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("verification:manage:any");
  if (user instanceof Response) return user;

  const { id } = await params;
  const verification = await prisma.wwcVerification.findUnique({
    where: { id },
    include: {
      workerProfile: true,
      organisation: { select: { id: true, name: true } },
      events: { orderBy: { createdAt: "desc" } },
      evidenceDocument: {
        select: {
          id: true,
          title: true,
          category: true,
          visibility: true,
          mimeType: true,
          createdAt: true,
        },
      },
      reviewedBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!verification) return jsonError("Not found", 404);

  return jsonOk({
    verification: {
      ...verification,
      checkNumber: verification.checkNumber,
    },
  });
}
