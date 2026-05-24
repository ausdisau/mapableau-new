import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { accessDeniedMessage } from "@/lib/access/role-policy";
import { approveInvoiceAsNominee } from "@/lib/family/nominee-service";
import { approveInvoiceSchema } from "@/lib/validation/family";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id: invoiceId } = await params;

  try {
    const body = approveInvoiceSchema.parse(await req.json());
    const result = await approveInvoiceAsNominee({
      nomineeId: user.id,
      participantId: body.participantId,
      invoiceId,
      linkId: body.linkId,
    });
    return jsonOk(result);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error) {
      if (e.message === "SCOPE_MISSING") {
        return jsonError(accessDeniedMessage("scope_missing"), 403);
      }
      if (e.message === "NO_LINK") {
        return jsonError(accessDeniedMessage("no_link"), 403);
      }
    }
    return jsonError("Could not approve invoice", 400);
  }
}
