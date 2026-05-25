import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { selectBackupOption } from "@/lib/service-recovery/service-recovery-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  const body = await req.json();
  if (!body.backupOptionId) return jsonError("backupOptionId required", 400);

  try {
    const recoveryCase = await selectBackupOption(
      id,
      body.backupOptionId,
      user.id
    );
    return jsonOk({ recoveryCase });
  } catch (error) {
    if (error instanceof Error && error.message === "UNSAFE_OPTION") {
      return jsonError("Backup option is not safe to offer", 400);
    }
    return jsonError("Select backup failed", 500);
  }
}
