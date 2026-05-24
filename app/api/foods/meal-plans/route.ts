import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  createMealPlan,
  listMealPlans,
} from "@/lib/foods/meal-plan-service";
import { mealPlanSchema } from "@/lib/validation/foods";

export async function GET() {
  const user = await requireApiPermission("care:manage:self");
  if (user instanceof Response) return user;
  const mealPlans = await listMealPlans(user.id);
  return jsonOk({ mealPlans });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("care:manage:self");
  if (user instanceof Response) return user;
  try {
    const parsed = mealPlanSchema.parse(await req.json());
    const mealPlan = await createMealPlan({
      participantId: user.id,
      actorUserId: user.id,
      name: parsed.name,
      items: parsed.items,
    });
    return jsonOk({ mealPlan }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message === "DIETARY_PROFILE_REQUIRED") {
      return jsonError("Complete your dietary profile first", 400);
    }
    return jsonError("Create meal plan failed", 500);
  }
}
