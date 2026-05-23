import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  allergyAcknowledged: z.literal(true),
  deliveryNotes: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = schema.parse(await req.json());
  const order = await prisma.foodOrder.create({
    data: {
      participantId: user.id,
      allergyAcknowledged: body.allergyAcknowledged,
      deliveryNotes: body.deliveryNotes,
      status: "requested",
    },
  });
  return jsonOk({ order });
}
