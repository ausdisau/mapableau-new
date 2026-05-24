import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  targetDate: z.string().datetime().optional(),
});

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const goals = await prisma.participantSupportGoal.findMany({
    where: { participantId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return jsonOk({ goals });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = schema.parse(await req.json());
  const goal = await prisma.participantSupportGoal.create({
    data: {
      participantId: user.id,
      title: body.title,
      description: body.description,
      targetDate: body.targetDate ? new Date(body.targetDate) : undefined,
    },
  });
  return jsonOk({ goal });
}
