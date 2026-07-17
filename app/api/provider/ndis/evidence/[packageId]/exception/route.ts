import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { recordProviderException } from "@/lib/ndis-gateway/evidence/evidence-package-service";
import { NdisGatewayError } from "@/lib/ndis-gateway/domain/errors";
import { jsonNdisError, jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import {
  mapBillingServiceError,
  resolveProviderOrganisationId,
} from "@/lib/ndis-gateway/security/org-scope";

const bodySchema = z.object({
  organisationId: z.string().cuid().optional(),
  exceptionCode: z.string().min(1).max(100),
  exceptionReason: z.string().min(1).max(2000),
});

type Params = { params: Promise<{ packageId: string }> };

/** POST /api/provider/ndis/evidence/[packageId]/exception */
export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("provider:evidence:exception");
  if (user instanceof Response) return user;

  const { packageId } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const organisationId = await resolveProviderOrganisationId(
    user,
    parsed.data.organisationId
  );
  if (organisationId instanceof Response) return organisationId;

  try {
    const evidence = await recordProviderException({
      evidencePackageId: packageId,
      organisationId,
      actorUserId: user.id,
      exceptionCode: parsed.data.exceptionCode,
      exceptionReason: parsed.data.exceptionReason,
    });
    return jsonNdisOk({ evidence });
  } catch (e) {
    if (e instanceof NdisGatewayError) {
      return jsonNdisError(e.plainLanguageMessage, 400);
    }
    const mapped = mapBillingServiceError(e);
    if (mapped) return mapped;
    throw e;
  }
}
