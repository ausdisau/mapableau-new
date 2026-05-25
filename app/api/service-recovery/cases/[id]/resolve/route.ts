import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { resolveRecoveryCase } from "@/lib/service-recovery/recovery-case-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  const body = await req.json();
  const updated = await resolveRecoveryCase(
    id,
    user.id,
    body.resolutionSummary
  );
  return jsonOk({ case: updated });
}
