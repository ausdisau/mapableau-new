import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { userCanAccessVerificationCase } from "@/lib/api/verification-scope";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { caseId } = await params;

  if (!(await userCanAccessVerificationCase(user, caseId))) {
    return jsonError("Forbidden", 403);
  }

  const verificationCase = await prisma.providerVerificationCase.findUnique({
    where: { id: caseId },
    include: {
      checks: true,
      organisation: { select: { id: true, name: true, abn: true, verificationStatus: true } },
      decisions: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!verificationCase) return jsonError("Not found", 404);
  return jsonOk({ case: verificationCase });
}
