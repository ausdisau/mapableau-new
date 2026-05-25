import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { hasPermission } from "@/lib/auth/permissions";
import { resolveRecoveryCase } from "@/lib/service-recovery/service-recovery-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!hasPermission(user.primaryRole, "support:manage:any")) {
    return jsonError("Forbidden", 403);
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const recoveryCase = await resolveRecoveryCase(
    id,
    user.id,
    body.status === "unresolved" ? "unresolved" : "resolved",
    body.note
  );
  return jsonOk({ recoveryCase });
}
