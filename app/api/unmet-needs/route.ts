import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { createUnmetNeed } from "@/lib/unmet-needs/unmet-need-service";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { searchParams } = new URL(req.url);
  const participantId = searchParams.get("participantId") ?? user.id;
  const records = await prisma.unmetNeedRecord.findMany({
    where: { participantId },
    orderBy: { createdAt: "desc" },
  });
  return jsonOk({ records });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = await req.json();
  const record = await createUnmetNeed({
    participantId: body.participantId ?? user.id,
    needType: body.needType,
    description: body.description,
    suburb: body.suburb,
    postcode: body.postcode,
    searchContext: body.searchContext,
    createdById: user.id,
  });
  return jsonOk({ record }, 201);
}
