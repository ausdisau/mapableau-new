import { requireApiPermission } from "@/lib/api/auth-handler";
import { projectEvidencePackageSafe } from "@/lib/ndis-gateway/evidence/evidence-projection";
import { validateEvidencePackage } from "@/lib/ndis-gateway/evidence/evidence-validator";
import { jsonNdisError, jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import { resolveProviderOrganisationId } from "@/lib/ndis-gateway/security/org-scope";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ packageId: string }> };

/** POST /api/provider/ndis/evidence/[packageId]/validate */
export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("provider:billing:validate");
  if (user instanceof Response) return user;

  const { packageId } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    organisationId?: string;
  };
  const organisationId = await resolveProviderOrganisationId(
    user,
    body.organisationId
  );
  if (organisationId instanceof Response) return organisationId;

  const pkg = await prisma.ndisServiceEvidencePackage.findFirst({
    where: { id: packageId, organisationId },
    include: { references: true },
  });
  if (!pkg) return jsonNdisError("Evidence package not found", 404);

  const validation = validateEvidencePackage({
    status: pkg.status,
    participantConfirmationMethod: pkg.participantConfirmationMethod,
    participantConfirmedAt: pkg.participantConfirmedAt,
    exceptionCode: pkg.exceptionCode,
    exceptionReason: pkg.exceptionReason,
    referenceCount: pkg.references.length,
  });

  return jsonNdisOk({
    validation,
    evidence: projectEvidencePackageSafe(pkg),
  });
}
