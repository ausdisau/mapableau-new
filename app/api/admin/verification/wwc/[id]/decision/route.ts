import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { applyWwcAdminDecision } from "@/lib/verification/wwc/wwc-verification-service";
import { wwcAdminDecisionSchema } from "@/lib/validation/wwc";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("verification:manage:any");
  if (user instanceof Response) return user;

  const { id } = await params;
  const body = await req.json();
  const parsed = wwcAdminDecisionSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, 400);
  }

  const updated = await applyWwcAdminDecision({
    verificationId: id,
    adminUserId: user.id,
    decision: parsed.data.decision,
    reviewNotes: parsed.data.reviewNotes,
    expiresAt: parsed.data.expiresAt,
    nextCheckAt: parsed.data.nextCheckAt,
    verifiedName: parsed.data.verifiedName,
  });

  return jsonOk({ verification: updated });
}
