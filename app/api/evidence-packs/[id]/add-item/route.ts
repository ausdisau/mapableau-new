import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { addEvidenceItem } from "@/lib/evidence-packs/evidence-source-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  const body = await req.json();
  try {
    const item = await addEvidenceItem({
      packId: id,
      sourceType: body.sourceType,
      sourceId: body.sourceId,
      label: body.label,
      sectionId: body.sectionId,
      snapshot: body.snapshot,
      viewer: user,
    });
    return jsonOk({ item }, 201);
  } catch (e) {
    if (e instanceof Error && e.message === "RESTRICTED_EVIDENCE") {
      return jsonError("Evidence not allowed without consent", 403);
    }
    throw e;
  }
}
