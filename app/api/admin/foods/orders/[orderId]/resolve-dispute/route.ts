import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { resolveFoodDispute } from "@/lib/foods/safety-service";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const user = await requireApiPermission("foods:admin");
  if (user instanceof Response) return user;
  const { orderId } = await params;
  const body = await req.json();
  const dispute = await prisma.foodDispute.findFirst({ where: { orderId, status: "open" } });
  if (!dispute) return jsonError("No open dispute", 404);
  const resolved = await resolveFoodDispute({ disputeId: dispute.id, actorUserId: user.id, resolution: body.resolution ?? "Resolved by MapAble admin" });
  return jsonOk({ dispute: resolved });
}
