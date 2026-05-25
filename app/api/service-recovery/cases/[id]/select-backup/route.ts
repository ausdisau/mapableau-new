import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { selectBackupOption } from "@/lib/service-recovery/backup-option-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  const body = await req.json();
  if (!body.optionId) return jsonError("optionId required", 400);
  const option = await selectBackupOption(id, body.optionId, user.id);
  return jsonOk({ option });
}
