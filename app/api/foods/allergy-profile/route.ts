import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import { upsertAllergyProfile } from "@/lib/foods/preferences-service";
import { allergyProfileSchema } from "@/lib/validation/foods";

export async function POST(req: Request) {
  const user = await requireApiPermission("foods:manage:self");
  if (user instanceof Response) return user;
  const body = await req.json();
  const parsed = allergyProfileSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const profile = await upsertAllergyProfile(user.id, parsed.data);
  return jsonOk({ profile });
}
