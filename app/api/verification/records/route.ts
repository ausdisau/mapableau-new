import type { VerificationRecordType } from "@prisma/client";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { hasPermission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { getProviderOrganisationForUser } from "@/lib/providers/provider-org-profile-service";
import { upsertVerificationRecord } from "@/lib/verification/verification-service";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const providerMembership = await getProviderOrganisationForUser(user.id);
  const records = await prisma.verificationRecord.findMany({
    where: isAdminRole(user.primaryRole)
      ? {}
      : providerMembership
        ? { organisationId: providerMembership.organisationId }
        : { profileId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return jsonOk({ records });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = await req.json();

  const providerMembership = await getProviderOrganisationForUser(user.id);
  if (
    !providerMembership &&
    !hasPermission(user.primaryRole, "verification:manage:any")
  ) {
    return jsonError("Forbidden", 403);
  }

  const organisationId =
    body.organisationId ?? providerMembership?.organisationId ?? undefined;
  const subjectType =
    body.subjectType ?? (organisationId ? "organisation" : "profile");
  const subjectId = body.subjectId ?? organisationId ?? user.id;

  const record = await upsertVerificationRecord({
    subjectType,
    subjectId,
    organisationId,
    profileId: body.profileId,
    recordType: body.recordType as VerificationRecordType,
    eligibilityGate: body.eligibilityGate,
    expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
    notes: body.notes,
    actorUserId: user.id,
  });

  return jsonOk({ record }, 201);
}
