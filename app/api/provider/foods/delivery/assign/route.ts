import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { assignFoodDelivery } from "@/lib/foods/delivery-service";
import { assignFoodDeliverySchema } from "@/lib/validation/foods";

const assignRequestSchema = assignFoodDeliverySchema.extend({ orderId: z.string().cuid() });

export async function POST(req: Request) {
  const user = await requireApiPermission("foods:manage:org");
  if (user instanceof Response) return user;
  const parsed = assignRequestSchema.safeParse(await req.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const [organisationId] = await getUserOrganisationIds(user.id);
  if (!organisationId) return jsonError("Provider organisation required", 403);
  const assignment = await assignFoodDelivery({ ...parsed.data, organisationId, actorUserId: user.id });
  return jsonOk({ assignment }, 201);
}
