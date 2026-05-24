import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  const bundle = await prisma.bookingBundle.findFirst({
    where: { id, participantId: user.id },
    include: { segments: { orderBy: { sequenceOrder: "asc" } }, events: true },
  });
  if (!bundle) return jsonError("Not found", 404);
  return jsonOk({ bundle });
}
