import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getEvidencePack } from "@/lib/evidence-packs/evidence-pack-service";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  try {
    const pack = await getEvidencePack(id, user);
    if (!pack) return jsonError("Not found", 404);
    return jsonOk({ pack });
  } catch {
    return jsonError("Forbidden", 403);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  const body = await req.json();
  const pack = await prisma.evidencePack.update({
    where: { id },
    data: { title: body.title, status: body.status },
  });
  return jsonOk({ pack });
}
