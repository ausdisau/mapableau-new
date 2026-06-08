import { z } from "zod";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { verifyProviderNdisRegistration } from "@/lib/provider/ndis-registration-service";

const schema = z.object({
  verified: z.boolean(),
  ndisRegistrationNumber: z.string().max(30).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const org = await verifyProviderNdisRegistration({
      adminUserId: user.id,
      organisationId: id,
      verified: parsed.data.verified,
      ndisRegistrationNumber: parsed.data.ndisRegistrationNumber,
    });
    return jsonOk({ organisation: org });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "NOT_FOUND") return jsonError("Not found", 404);
    if (msg === "INVALID_NDIS_REGISTRATION_NUMBER") {
      return jsonError("Invalid NDIS registration number", 400);
    }
    return jsonError("Update failed", 500);
  }
}
