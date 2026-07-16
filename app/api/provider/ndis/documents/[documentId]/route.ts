import { requireApiPermission } from "@/lib/api/auth-handler";
import { projectBillingDocumentSafe } from "@/lib/ndis-gateway/documents/document-projection";
import { jsonNdisError, jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import { resolveProviderOrganisationId } from "@/lib/ndis-gateway/security/org-scope";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ documentId: string }> };

/** GET /api/provider/ndis/documents/[documentId] */
export async function GET(req: Request, { params }: Params) {
  const user = await requireApiPermission("provider:billing:view");
  if (user instanceof Response) return user;

  const { documentId } = await params;
  const url = new URL(req.url);
  const organisationId = await resolveProviderOrganisationId(
    user,
    url.searchParams.get("organisationId")
  );
  if (organisationId instanceof Response) return organisationId;

  const doc = await prisma.ndisBillingDocument.findFirst({
    where: { id: documentId, organisationId },
  });
  if (!doc) return jsonNdisError("Document not found", 404);

  return jsonNdisOk({
    document: projectBillingDocumentSafe(doc),
    safeDocument: doc.safeDocumentJson,
  });
}
