import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

const schema = z.object({ fileName: z.string().min(1) });

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = schema.parse(await req.json());
  const upload = await prisma.ndisPlanUpload.create({
    data: {
      participantId: user.id,
      fileName: body.fileName,
      storageKey: `pending/${user.id}/${Date.now()}-${body.fileName}`,
      status: "uploaded",
    },
  });
  return jsonOk({ upload });
}
