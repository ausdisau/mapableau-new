import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  status: z.string().optional(),
  targetDate: z.string().datetime().optional().nullable(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  const existing = await prisma.participantSupportGoal.findFirst({
    where: { id, participantId: user.id },
  });
  if (!existing) return jsonError("Not found", 404);
  const body = patchSchema.parse(await req.json());
  const goal = await prisma.participantSupportGoal.update({
    where: { id },
    data: {
      ...body,
      targetDate:
        body.targetDate === null
          ? null
          : body.targetDate
            ? new Date(body.targetDate)
            : undefined,
    },
  });
  return jsonOk({ goal });
}
