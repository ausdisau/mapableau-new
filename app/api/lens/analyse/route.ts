import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { analyseLensImage } from "@/lib/lens/lens-analysis-adapter";
import { prisma } from "@/lib/prisma";

const schema = z.object({ uploadId: z.string() });

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = schema.parse(await req.json());
  const upload = await prisma.lensUpload.findFirst({
    where: { id: body.uploadId, userId: user.id },
    include: { reviewTasks: true },
  });
  if (!upload) return jsonError("Not found", 404);
  const observation = await analyseLensImage(upload.storageKey);
  const task = upload.reviewTasks[0];
  if (task) {
    await prisma.lensReviewTask.update({
      where: { id: task.id },
      data: { observationJson: observation },
    });
  }
  return jsonOk({ observation });
}
