import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createInvoicePlaceholderForBooking } from "@/lib/care/care-invoice-link-service";
import { invoicePlaceholderSchema } from "@/lib/validation/care";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("care:manage:org");
  if (user instanceof Response) return user;
  const parsed = invoicePlaceholderSchema.safeParse(await req.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { id } = await params;
  try {
    const invoiceLink = await createInvoicePlaceholderForBooking({
      bookingId: id,
      actorUserId: user.id,
      ...parsed.data,
    });
    return jsonOk({ invoiceLink }, 201);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to create invoice placeholder", 400);
  }
}
import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { assertProviderOrgAccess, isCareAccessError } from "@/lib/care/access-control";
import { createInvoicePlaceholderForBooking } from "@/lib/care/care-invoice-link-service";
import { prisma } from "@/lib/prisma";
import { invoicePlaceholderSchema } from "@/lib/validation/care";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("care:manage:org");
  if (user instanceof Response) return user;
  const { id } = await params;

  try {
    const parsed = invoicePlaceholderSchema.parse(await req.json());
    const booking = await prisma.careBooking.findUnique({ where: { id } });
    if (!booking) return jsonError("Not found", 404);
    await assertProviderOrgAccess(user, booking.organisationId);
    const invoiceLink = await createInvoicePlaceholderForBooking({
      bookingId: id,
      actorUserId: user.id,
      ...parsed,
    });
    return jsonOk({ invoiceLink }, 201);
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    if (isCareAccessError(error)) return jsonError("Forbidden", 403);
    if (error instanceof Error && error.message === "SERVICE_LOG_REQUIRED") {
      return jsonError("A confirmed service log is required before invoicing.", 409);
    }
    return jsonError("Invoice placeholder failed", 500);
  }
}
