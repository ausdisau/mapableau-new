import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { participantDisputeServiceLog } from "@/lib/service-logs/service-log-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  const body = await req.json();

  try {
    const log = await participantDisputeServiceLog(
      id,
      user.id,
      body.reason ?? "Participant dispute"
    );
    return jsonOk({ serviceLog: log });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return jsonError("Forbidden", 403);
    }
    return jsonError("Dispute failed", 500);
  }
}
