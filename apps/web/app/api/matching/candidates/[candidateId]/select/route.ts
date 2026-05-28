import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { selectMatchCandidate } from "@/lib/matching/matching-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  const user = await requireApiPermission("matching:select");
  if (user instanceof Response) return user;
  const { candidateId } = await params;
  const body = await req.json().catch(() => ({}));
  const candidate = await selectMatchCandidate(
    candidateId,
    user.id,
    body.notes
  );
  return jsonOk({ candidate });
}
