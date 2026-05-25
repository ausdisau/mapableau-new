import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import { reportFoodSafetyIssue } from "@/lib/foods/safety-service";
import { foodSafetyIssueSchema } from "@/lib/validation/foods";

export async function POST(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const user = await requireApiPermission("foods:manage:self");
  if (user instanceof Response) return user;
  const parsed = foodSafetyIssueSchema.safeParse(await req.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { orderId } = await params;
  const event = await reportFoodSafetyIssue({ orderId, reportedById: user.id, ...parsed.data });
  return jsonOk({ event }, 201);
}
