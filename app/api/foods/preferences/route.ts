import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { foodErrorResponse } from "@/lib/foods/api-errors";
import {
  getFoodPreferences,
  upsertFoodPreferences,
} from "@/lib/foods/preferences-service";
import { foodPreferencesSchema } from "@/lib/validation/foods";

export async function GET() {
  const user = await requireApiPermission("foods:read:self");
  if (user instanceof Response) return user;
  const preferences = await getFoodPreferences(user.id);
  return jsonOk(preferences);
}

export async function PUT(req: Request) {
  const user = await requireApiPermission("foods:manage:self");
  if (user instanceof Response) return user;
  try {
    const parsed = foodPreferencesSchema.parse(await req.json());
    const preferences = await upsertFoodPreferences(user.id, parsed);
    return jsonOk(preferences);
  } catch (error) {
    return foodErrorResponse(error);
  }
}
