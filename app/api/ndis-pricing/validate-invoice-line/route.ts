import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import { validateInvoiceLine } from "@/lib/ndis-pricing/invoice-line-validator";
import { validateInvoiceLineSchema } from "@/types/ndis-pricing";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const input = validateInvoiceLineSchema.parse(await req.json());
    const audience =
      (new URL(req.url).searchParams.get("audience") as
        | "participant"
        | "provider"
        | "admin"
        | null) ?? "provider";
    const result = await validateInvoiceLine(input, audience);
    return jsonOk(result);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    throw e;
  }
}
