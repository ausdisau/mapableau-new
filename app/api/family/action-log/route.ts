import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { listNomineeActionLog } from "@/lib/family/supported-decision-service";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const participantId = url.searchParams.get("participantId") ?? undefined;

  const logs = await listNomineeActionLog({
    nomineeId: user.id,
    participantId,
    limit: 50,
  });

  return jsonOk({ logs });
}
