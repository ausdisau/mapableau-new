import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  canEditWorkerProfile,
  getProviderMembership,
  getSessionUserId,
  isValidProviderId,
} from "@/app/utils/provider-admin";
import { ensureProviderOrganisation } from "@/lib/providers/ensure-provider-organisation";
import { prisma } from "@/lib/prisma";
import {
  PatchWorkerPayload,
  patchWorkerPayloadSchema,
  PatchWorkerResponse,
} from "@/schemas/provider-admin.types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ providerId: string; workerId: string }> },
): Promise<NextResponse<PatchWorkerResponse | { error: string }>> {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { providerId, workerId } = await params;
  if (!isValidProviderId(providerId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const membership = await getProviderMembership(userId, providerId);
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const organisationId = await ensureProviderOrganisation(providerId);
  if (!organisationId) {
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  }

  const profile = await prisma.workerProfile.findFirst({
    where: {
      id: workerId,
      organisationId,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!profile) {
    return NextResponse.json(
      { error: "Worker not found for this provider" },
      { status: 404 },
    );
  }

  if (
    !canEditWorkerProfile({
      role: membership.role,
      sessionUserId: userId,
      workerUserId: profile.userId ?? "",
    })
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: PatchWorkerPayload;
  try {
    const json = await request.json();
    const parsed = patchWorkerPayloadSchema.parse(json);
    body = parsed;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const hasProfileField =
    body.name !== undefined ||
    body.bio !== undefined ||
    body.qualifications !== undefined;
  const hasRelField =
    body.languageIds !== undefined || body.specialisationIds !== undefined;

  if (!hasProfileField && !hasRelField) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  let languageNames: string[] | undefined;
  let specNames: string[] | undefined;

  if (body.languageIds !== undefined && body.languageIds !== null) {
    const langs = await prisma.language.findMany({
      where: { id: { in: body.languageIds } },
      select: { name: true },
    });
    if (langs.length !== body.languageIds.length) {
      return NextResponse.json(
        { error: "One or more language ids are invalid" },
        { status: 400 },
      );
    }
    languageNames = langs.map((l) => l.name);
  }

  if (body.specialisationIds !== undefined && body.specialisationIds !== null) {
    const specs = await prisma.specialisation.findMany({
      where: { id: { in: body.specialisationIds } },
      select: { name: true },
    });
    if (specs.length !== body.specialisationIds.length) {
      return NextResponse.json(
        { error: "One or more specialisation ids are invalid" },
        { status: 400 },
      );
    }
    specNames = specs.map((s) => s.name);
  }

  await prisma.$transaction(async (tx) => {
    if (body.name !== undefined && body.name !== null && profile.userId) {
      await tx.user.update({
        where: { id: profile.userId },
        data: { name: body.name.trim() },
      });
    }

    await tx.workerProfile.update({
      where: { id: profile.id },
      data: {
        ...(body.name !== undefined &&
          body.name !== null && { displayName: body.name.trim() }),
        ...(body.bio !== undefined && {
          profileSummary: body.bio?.trim() || null,
        }),
        ...(body.qualifications !== undefined && {
          qualificationsSummary: body.qualifications?.trim() || null,
        }),
        ...(languageNames !== undefined && { languages: languageNames }),
        ...(specNames !== undefined && { specialisations: specNames }),
      },
    });
  });

  revalidatePath(`/provider-admin/${providerId}`);

  const updated = await prisma.workerProfile.findUnique({
    where: { id: profile.id },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    worker: {
      id: updated.id,
      userId: updated.userId ?? "",
      name: updated.user?.name ?? updated.displayName,
      email: updated.user?.email ?? null,
      bio: updated.profileSummary,
      qualifications: updated.qualificationsSummary,
      languages: updated.languages.map((name) => ({ id: name, name })),
      specialisations: updated.specialisations.map((name) => ({
        id: name,
        name,
      })),
    },
  });
}
