import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonNdisError, jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import { resolveProviderOrganisationId } from "@/lib/ndis-gateway/security/org-scope";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

/** GET /api/provider/ndis/portal-exports/[id] */
export async function GET(req: Request, { params }: Params) {
  const user = await requireApiPermission("provider:billing:view");
  if (user instanceof Response) return user;

  const { id } = await params;
  const url = new URL(req.url);
  const organisationId = await resolveProviderOrganisationId(
    user,
    url.searchParams.get("organisationId")
  );
  if (organisationId instanceof Response) return organisationId;

  const batch = await prisma.ndisBillingBatch.findFirst({
    where: {
      id,
      organisationId,
      billingRoute: "ndis_ndia_managed",
    },
    include: {
      members: { select: { billableItemId: true } },
      documents: {
        select: {
          id: true,
          documentNumber: true,
          status: true,
          dispatchStatus: true,
          manuallySubmittedAt: true,
        },
      },
    },
  });
  if (!batch) return jsonNdisError("Portal export not found", 404);

  return jsonNdisOk({
    portalExport: {
      id: batch.id,
      batchReference: batch.batchReference,
      status: batch.status,
      exportFileName: batch.exportFileName,
      exportChecksum: batch.exportChecksum,
      exportedAt: batch.exportedAt?.toISOString() ?? null,
      createdAt: batch.createdAt.toISOString(),
      billableItemIds: batch.members.map((m) => m.billableItemId),
      documents: batch.documents,
      message:
        "Upload the package manually in the myplace provider portal. Use “Record manual portal submission” after you have submitted.",
    },
  });
}
