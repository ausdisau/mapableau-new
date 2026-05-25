import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { resolveDispute } from "@/lib/foods/safety-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const user = await requireApiPermission("foods:admin");
  if (user instanceof Response) return user;
  const { orderId } = await params;
  const body = await req.json().catch(() => ({}));
  const resolution =
    typeof body.resolution === "string" ? body.resolution : "Resolved by admin";
  try {
    const dispute = await resolveDispute(orderId, user.id, resolution);
    return jsonOk({ dispute });
  } catch {
    return jsonError("Dispute not found", 404);
  }
}
