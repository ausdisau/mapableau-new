import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { foodErrorResponse } from "@/lib/foods/api-errors";
import { recordFoodHandover } from "@/lib/foods/handover-service";

const handoverSchema = z.object({
  checklist: z.record(z.string(), z.unknown()).default({}),
  photoUrl: z.string().url().optional(),
  notes: z.string().max(1000).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const user = await requireApiPermission("foods:deliver:assigned");
  if (user instanceof Response) return user;
  try {
    const { assignmentId } = await params;
    const parsed = handoverSchema.parse(await req.json());
    const record = await recordFoodHandover({
      assignmentId,
      actorUserId: user.id,
      ...parsed,
    });
    return jsonOk({ record }, 201);
  } catch (error) {
    return foodErrorResponse(error);
  }
}
