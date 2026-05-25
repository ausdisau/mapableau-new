import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import { reportFoodIssue } from "@/lib/foods/safety-service";
import { reportIssueSchema } from "@/lib/validation/foods";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const user = await requireApiPermission("foods:manage:self");
  if (user instanceof Response) return user;
  const { orderId } = await params;
  const body = await req.json();
  const parsed = reportIssueSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const event = await reportFoodIssue({
    orderId,
    reporterId: user.id,
    description: parsed.data.description,
    severity: parsed.data.severity,
  });
  return jsonOk({ event }, 201);
}
