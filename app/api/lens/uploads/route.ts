import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  storageKey: z.string().min(1),
  placeId: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = schema.parse(await req.json());
  const upload = await prisma.lensUpload.create({
    data: {
      userId: user.id,
      placeId: body.placeId,
      storageKey: body.storageKey,
      reviewTasks: {
        create: { status: "pending" },
      },
    },
    include: { reviewTasks: true },
  });
  return jsonOk({
    upload,
    reviewTaskId: upload.reviewTasks[0]?.id,
  });
}
