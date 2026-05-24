import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

const schema = z.object({ title: z.string().min(1) });

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = schema.parse(await req.json());
  const itinerary = await prisma.tourismItinerary.create({
    data: { participantId: user.id, title: body.title },
  });
  return jsonOk({ itinerary });
}
