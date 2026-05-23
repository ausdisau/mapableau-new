import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

const schema = z.object({ mode: z.enum(["chat", "form"]).default("chat") });

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = schema.parse(await req.json());
  const session = await prisma.intakeSession.create({
    data: { participantId: user.id, mode: body.mode },
  });
  return jsonOk({ session });
}
