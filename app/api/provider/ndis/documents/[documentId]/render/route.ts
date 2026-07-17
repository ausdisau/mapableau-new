import { requireApiPermission } from "@/lib/api/auth-handler";
import { renderDocumentPlainText } from "@/lib/ndis-gateway/documents/document-renderer";
import type { RenderableDocument } from "@/lib/ndis-gateway/documents/document-renderer";
import { projectBillingDocumentSafe } from "@/lib/ndis-gateway/documents/document-projection";
import { jsonNdisError, jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import { resolveProviderOrganisationId } from "@/lib/ndis-gateway/security/org-scope";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ documentId: string }> };

function isRenderableDocument(value: unknown): value is RenderableDocument {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.documentNumber === "string" &&
    typeof v.documentKind === "string" &&
    Array.isArray(v.lines)
  );
}

/** POST /api/provider/ndis/documents/[documentId]/render */
export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("provider:billing:view");
  if (user instanceof Response) return user;

  const { documentId } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    organisationId?: string;
  };
  const organisationId = await resolveProviderOrganisationId(
    user,
    body.organisationId
  );
  if (organisationId instanceof Response) return organisationId;

  const doc = await prisma.ndisBillingDocument.findFirst({
    where: { id: documentId, organisationId },
  });
  if (!doc) return jsonNdisError("Document not found", 404);

  const safeJson = doc.safeDocumentJson;
  const plainText = isRenderableDocument(safeJson)
    ? renderDocumentPlainText(safeJson)
    : null;

  return jsonNdisOk({
    document: projectBillingDocumentSafe(doc),
    plainText,
    safeDocument: safeJson,
  });
}
