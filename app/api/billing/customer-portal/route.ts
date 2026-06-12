import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createCustomerPortalSession } from "@/lib/billing-core/portal-service";
import { z } from "zod";

const bodySchema = z.object({
  returnUrl: z.string().url().optional(),
});

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let body: z.infer<typeof bodySchema> = {};
  try {
    const raw = await req.json().catch(() => ({}));
    body = bodySchema.parse(raw);
  } catch {
    return jsonError("Invalid request body", 400);
  }

  const result = await createCustomerPortalSession({
    userId: user.id,
    role: "participant",
    returnUrl: body.returnUrl,
    createCustomerIfMissing: true,
  });
  if (!result.ok) return jsonError(result.error ?? "Portal unavailable", 400);
  return jsonOk({ portalUrl: result.portalUrl });
}
