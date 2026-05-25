import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  createEvidencePack,
  listEvidencePacks,
} from "@/lib/evidence-packs/evidence-pack-service";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { searchParams } = new URL(req.url);
  const participantId = searchParams.get("participantId") ?? user.id;
  const packs = await listEvidencePacks(participantId);
  return jsonOk({ packs });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = await req.json();
  const pack = await createEvidencePack({
    participantId: body.participantId ?? user.id,
    packType: body.packType,
    title: body.title,
    createdById: user.id,
  });
  return jsonOk({ pack }, 201);
}
