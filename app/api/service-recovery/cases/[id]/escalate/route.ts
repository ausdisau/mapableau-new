import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { escalateRecoveryCase } from "@/lib/service-recovery/service-recovery-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const recoveryCase = await escalateRecoveryCase(
    id,
    user.id,
    body.reason ?? "Escalated for support review"
  );
  return jsonOk({ recoveryCase });
}
