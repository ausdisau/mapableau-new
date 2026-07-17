import { requireApiPermission } from "@/lib/api/auth-handler";
import { getBillableItemSafe } from "@/lib/ndis-gateway/billing/billable-item-service";
import { validateBillableItemDraft } from "@/lib/ndis-gateway/billing/billable-item-validator";
import { jsonNdisError, jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import { resolveProviderOrganisationId } from "@/lib/ndis-gateway/security/org-scope";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

/** POST /api/provider/ndis/billable-items/[id]/validate */
export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("provider:billing:validate");
  if (user instanceof Response) return user;

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    organisationId?: string;
  };
  const organisationId = await resolveProviderOrganisationId(
    user,
    body.organisationId
  );
  if (organisationId instanceof Response) return organisationId;

  const item = await prisma.ndisBillableServiceItem.findFirst({
    where: { id, organisationId },
  });
  if (!item) return jsonNdisError("Billable item not found", 404);

  const validation = validateBillableItemDraft({
    billingRoute: item.billingRoute,
    ndisPaymentRoute: item.ndisPaymentRoute,
    participantId: item.participantId,
    supportItemCode: item.supportItemCode,
    serviceStartAt: item.serviceStartAt,
    serviceEndAt: item.serviceEndAt,
    unitPriceCents: item.unitPriceCents,
    totalCents: item.totalCents,
    pricingProvenanceJson: item.pricingProvenanceJson,
    statusTarget: "ready",
  });

  if (validation.valid && item.status === "draft") {
    await prisma.ndisBillableServiceItem.update({
      where: { id: item.id },
      data: {
        status: "ready",
        blockingIssuesJson: [],
        warningsJson: validation.warnings,
      },
    });
  } else if (!validation.valid) {
    await prisma.ndisBillableServiceItem.update({
      where: { id: item.id },
      data: {
        status: "validation_failed",
        blockingIssuesJson: validation.blockingIssues,
        warningsJson: validation.warnings,
      },
    });
  }

  const safe = await getBillableItemSafe({
    organisationId,
    billableItemId: id,
  });

  return jsonNdisOk({ validation, item: safe });
}
