import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { exportEvidencePack } from "@/lib/evidence-packs/evidence-pack-export-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  const body = await req.json();
  try {
    const result = await exportEvidencePack({
      packId: id,
      exportedById: user.id,
      format: body.format ?? "json",
      viewer: user,
    });
    return jsonOk(result);
  } catch {
    return jsonError("Forbidden", 403);
  }
}
