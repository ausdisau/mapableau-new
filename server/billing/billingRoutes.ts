import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import {
  AgenticBillingError,
  assertParticipantAccess,
  createAgenticInvoiceDraft,
  disputeAgenticInvoice,
  getAgenticInvoiceSummary,
  reevaluateAgenticGuardrails,
} from "@/server/billing/invoiceDraftService";
import {
  disputeInvoiceInputSchema,
  draftInvoiceInputSchema,
  evaluateGuardrailsInputSchema,
} from "@/server/billing/billingTypes";

function handleBillingError(err: unknown): Response {
  if (err instanceof AgenticBillingError) {
    const status =
      err.code === "FORBIDDEN"
        ? 403
        : err.code === "INVOICE_NOT_FOUND" || err.code === "BOOKING_NOT_FOUND"
          ? 404
          : 400;
    return Response.json({ error: err.message, code: err.code }, { status });
  }
  throw err;
}

export async function postDraftInvoice(req: Request): Promise<Response> {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const body = await req.json();
    const parsed = draftInvoiceInputSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const isAdmin = isAdminRole(user.primaryRole);
    assertParticipantAccess(
      user.id,
      parsed.data.participantId,
      isAdmin
    );

    const result = await createAgenticInvoiceDraft(user.id, parsed.data);
    return jsonOk(result, 201);
  } catch (err) {
    return handleBillingError(err);
  }
}

export async function postEvaluateGuardrails(req: Request): Promise<Response> {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const body = await req.json();
    const parsed = evaluateGuardrailsInputSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const summary = await getAgenticInvoiceSummary(parsed.data.invoiceId);
    const isAdmin = isAdminRole(user.primaryRole);
    assertParticipantAccess(
      user.id,
      summary.invoiceDraft.participantId,
      isAdmin
    );

    const result = await reevaluateAgenticGuardrails(
      parsed.data.invoiceId,
      user.id
    );
    return jsonOk({
      invoiceId: parsed.data.invoiceId,
      guardrailDecision: result.guardrailDecision,
      requiresApproval: result.requiresApproval,
      canSendOrSubmit: false,
    });
  } catch (err) {
    return handleBillingError(err);
  }
}

export async function getBillingSummary(
  _req: Request,
  invoiceId: string
): Promise<Response> {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const summary = await getAgenticInvoiceSummary(invoiceId);
    const isAdmin = isAdminRole(user.primaryRole);
    assertParticipantAccess(
      user.id,
      summary.invoiceDraft.participantId,
      isAdmin
    );

    return jsonOk({
      invoiceDraft: summary.invoiceDraft,
      participantSummary: summary.participantSummary,
      guardrailDecision: summary.guardrailDecision,
      billingGraph: summary.billingGraph,
      requiresApproval: summary.requiresApproval,
      canSendOrSubmit: false,
    });
  } catch (err) {
    return handleBillingError(err);
  }
}

export async function postDisputeInvoice(req: Request): Promise<Response> {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const body = await req.json();
    const parsed = disputeInvoiceInputSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const existing = await getAgenticInvoiceSummary(parsed.data.invoiceId);
    const isAdmin = isAdminRole(user.primaryRole);
    assertParticipantAccess(
      user.id,
      existing.invoiceDraft.participantId,
      isAdmin
    );

    const result = await disputeAgenticInvoice(
      user.id,
      parsed.data.invoiceId,
      parsed.data.reason
    );
    return jsonOk({
      ...result,
      sendBlocked: true,
      canSendOrSubmit: false,
    });
  } catch (err) {
    return handleBillingError(err);
  }
}
