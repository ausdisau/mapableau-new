import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, zodErrorResponse } from "@/lib/api/response";
import { assertInvoiceAccess } from "@/lib/billing/invoice-access-service";
import type { CurrentUser } from "@/lib/auth/current-user";

export async function requireInvoiceSession() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  return user;
}

export async function requireInvoiceAccess(invoiceId: string) {
  const user = await requireInvoiceSession();
  if (user instanceof Response) return user;
  try {
    const invoice = await assertInvoiceAccess(user, invoiceId);
    return { user, invoice };
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return jsonError("Forbidden", 403);
    }
    if (e instanceof Error && e.message === "INVOICE_NOT_FOUND") {
      return jsonError("Invoice not found", 404);
    }
    throw e;
  }
}

export function handleBillingApiError(e: unknown) {
  if (e instanceof ZodError) return zodErrorResponse(e);
  if (e instanceof Error) {
    if (e.message === "FORBIDDEN") return jsonError("Forbidden", 403);
    if (e.message === "INVOICE_NOT_FOUND") return jsonError("Invoice not found", 404);
    if (e.message === "APPROVAL_REQUIRED") {
      return jsonError("Participant approval required before issuing", 409);
    }
    if (e.message === "SERVICE_NOT_COMPLETED") {
      return jsonError("Service must be completed before invoicing", 409);
    }
  }
  throw e;
}

export type InvoiceActor = CurrentUser;
