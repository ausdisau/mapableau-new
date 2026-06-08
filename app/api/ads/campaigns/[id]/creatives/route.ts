import { addCreative } from "@/lib/ads/campaign-service";
import { createCreativeSchema } from "@/lib/ads/schemas";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await params;
  const body = await req.json();
  const parsed = createCreativeSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const result = await addCreative(user, id, parsed.data);
  if (!result.ok) return jsonError(result.error, 400);

  return jsonOk({ creative: result.creative }, 201);
}
