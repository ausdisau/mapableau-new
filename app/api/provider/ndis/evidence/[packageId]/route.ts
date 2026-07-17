import { requireApiPermission } from "@/lib/api/auth-handler";
import { projectEvidencePackageSafe } from "@/lib/ndis-gateway/evidence/evidence-projection";
import { jsonNdisError, jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import { resolveProviderOrganisationId } from "@/lib/ndis-gateway/security/org-scope";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ packageId: string }> };

/** GET /api/provider/ndis/evidence/[packageId] */
export async function GET(req: Request, { params }: Params) {
  const user = await requireApiPermission("provider:evidence:view");
  if (user instanceof Response) return user;

  const { packageId } = await params;
  const url = new URL(req.url);
  const organisationId = await resolveProviderOrganisationId(
    user,
    url.searchParams.get("organisationId")
  );
  if (organisationId instanceof Response) return organisationId;

  const pkg = await prisma.ndisServiceEvidencePackage.findFirst({
    where: { id: packageId, organisationId },
  });
  if (!pkg) return jsonNdisError("Evidence package not found", 404);

  return jsonNdisOk({ evidence: projectEvidencePackageSafe(pkg) });
}
