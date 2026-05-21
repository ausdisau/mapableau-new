import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shiftId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { shiftId } = await params;

  const shift = await prisma.careShift.findUnique({
    where: { id: shiftId },
    include: { careRequest: true, workerProfile: true },
  });
  if (!shift) return jsonError("Not found", 404);
  return jsonOk({ shift });
}
