import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { upsertSubstitutionPreferences } from "@/lib/foods/preferences-service";
import { foodSubstitutionPolicySchema } from "@/lib/validation/foods";
import { z } from "zod";

const schema = z.object({
  policy: foodSubstitutionPolicySchema,
  notes: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  const user = await requireApiPermission("foods:manage:self");
  if (user instanceof Response) return user;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Validation failed" }, { status: 400 });
  }
  const pref = await upsertSubstitutionPreferences(
    user.id,
    parsed.data.policy,
    parsed.data.notes
  );
  return jsonOk({ preference: pref });
}
