import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  createEnrollmentCheckout,
  type EnrollmentProduct,
} from "@/lib/monetization/enrollment-checkout-service";

const bodySchema = z.object({
  product: z.enum([
    "provider_academy",
    "partner_api_program",
    "access_accreditation",
  ]),
  referenceId: z.string().optional(),
  organisationId: z.string().optional(),
});

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const result = await createEnrollmentCheckout({
    userId: user.id,
    product: parsed.data.product as EnrollmentProduct,
    referenceId: parsed.data.referenceId,
    organisationId: parsed.data.organisationId,
  });

  if (!result.ok) return jsonError(result.error ?? "Checkout failed", 400);

  return jsonOk({
    checkoutUrl: result.checkoutUrl,
    invoiceId: result.invoiceId,
  });
}
