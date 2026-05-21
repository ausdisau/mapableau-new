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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ shiftId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { shiftId } = await params;
  const body = await req.json();
  const shift = await prisma.careShift.update({
    where: { id: shiftId },
    data: {
      workerProfileId: body.workerProfileId,
      status: body.status,
      workerNotes: body.workerNotes,
    },
  });
  return jsonOk({ shift });
}
