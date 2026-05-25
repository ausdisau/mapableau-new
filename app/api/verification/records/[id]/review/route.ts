import type { VerificationRecordStatus } from "@prisma/client";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { hasPermission } from "@/lib/auth/permissions";
import { reviewVerificationRecord } from "@/lib/verification/verification-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!hasPermission(user.primaryRole, "verification:manage:any")) {
    return jsonError("Forbidden", 403);
  }

  const { id } = await params;
  const body = await req.json();
  const record = await reviewVerificationRecord({
    recordId: id,
    status: (body.status ?? "pending_review") as VerificationRecordStatus,
    actorUserId: user.id,
    notes: body.notes,
  });

  return jsonOk({ record });
}
