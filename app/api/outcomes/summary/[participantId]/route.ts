import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { buildOutcomeSummary } from "@/lib/outcomes/outcome-summary-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ participantId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { participantId } = await params;
  try {
    const summary = await buildOutcomeSummary(participantId, user);
    return jsonOk({ summary });
  } catch {
    return jsonError("Forbidden", 403);
  }
}
