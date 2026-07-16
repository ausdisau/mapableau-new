import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  isAccessCapsulesEnabled,
  isRightsOsEnabled,
} from "@/lib/rights-os/config";
import { createAccessCapsule } from "@/lib/rights-os/capsules/capsule-service";
import { createCapsuleSchema } from "@/lib/validation/rights-os";

export async function GET() {
  if (!isRightsOsEnabled() || !isAccessCapsulesEnabled()) {
    return jsonError("Access Capsules are not enabled", 404);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { prisma } = await import("@/lib/prisma");
  const capsules = await prisma.accessCapsule.findMany({
    where: { subjectUserId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return jsonOk({ capsules });
}

export async function POST(req: Request) {
  if (!isRightsOsEnabled() || !isAccessCapsulesEnabled()) {
    return jsonError("Access Capsules are not enabled", 404);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const parsed = createCapsuleSchema.parse(await req.json());
    const result = await createAccessCapsule({
      subjectUserId: user.id,
      purposeCode: parsed.purposeCode,
      disclosedFields: parsed.disclosedFields,
      recipientOrganisationId: parsed.recipientOrganisationId,
      presentationMethod: parsed.presentationMethod,
      expiresInHours: parsed.expiresInHours,
      actorUserId: user.id,
    });

    const { buildCapsuleSecureLink, buildPrintableCapsuleCard } = await import(
      "@/lib/rights-os/capsules/capsule-service"
    );

    return jsonOk(
      {
        capsule: result.capsule,
        secureLink: buildCapsuleSecureLink(result.capsule.id, result.secureToken),
        printableCard: buildPrintableCapsuleCard(result.capsule),
        qrAlternative: "Telephone verification and printable card are available if QR is not usable.",
      },
      201
    );
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Failed to create capsule", 500);
  }
}
