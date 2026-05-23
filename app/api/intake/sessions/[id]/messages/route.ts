import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  const session = await prisma.intakeSession.findFirst({
    where: { id, participantId: user.id },
  });
  if (!session) return jsonError("Not found", 404);
  const body = schema.parse(await req.json());
  const message = await prisma.intakeMessage.create({
    data: { sessionId: id, role: body.role, content: body.content },
  });
  return jsonOk({ message });
}
