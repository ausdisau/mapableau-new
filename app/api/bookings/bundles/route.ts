import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { createBundle } from "@/lib/orchestration/care-transport-bundle-orchestrator";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  title: z.string().optional(),
  journeyStart: z.string().datetime(),
});

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = schema.parse(await req.json());
  const result = await createBundle({
    participantId: user.id,
    createdById: user.id,
    title: body.title,
    journeyStart: new Date(body.journeyStart),
    actorRole: user.primaryRole,
  });
  return jsonOk(result);
}

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const bundles = await prisma.bookingBundle.findMany({
    where: { participantId: user.id },
    include: { segments: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return jsonOk({ bundles });
}
