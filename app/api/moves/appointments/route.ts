import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  mode: z.enum(["in_person", "telehealth"]).default("in_person"),
  scheduledStart: z.string().datetime().optional(),
});

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = schema.parse(await req.json());
  const appointment = await prisma.alliedHealthAppointment.create({
    data: {
      participantId: user.id,
      mode: body.mode,
      scheduledStart: body.scheduledStart
        ? new Date(body.scheduledStart)
        : undefined,
    },
  });
  return jsonOk({ appointment });
}
