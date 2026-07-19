import type { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { accessibilityProfileSchema } from "@/lib/validation/accessibility";

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

const defaultProfile = {
  mobilityNeeds: [],
  communicationPreferences: [],
  sensoryPreferences: {},
  cognitivePreferences: {},
  transportRequirements: {},
  digitalPreferences: {},
  shareWithProviders: {},
};

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let profile = await prisma.accessibilityProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    profile = await prisma.accessibilityProfile.create({
      data: { userId: user.id, ...defaultProfile },
    });
  }

  return jsonOk({ profile });
}

export async function PATCH(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const body = await req.json();
    const parsed = accessibilityProfileSchema.parse(body);
    const existing = await prisma.accessibilityProfile.findUnique({
      where: { userId: user.id },
    });

    // Merge JSON objects so a partial client payload cannot erase nested data.
    // shareWithProviders is intentionally excluded — use
    // PATCH /api/accessibility-profile/share-settings so consent-shaped data
    // cannot be wiped by a narrow preferences or legacy boolean payload.
    const merged = {
      mobilityNeeds: parsed.mobilityNeeds,
      communicationPreferences: parsed.communicationPreferences,
      sensoryPreferences: toJson({
        ...((existing?.sensoryPreferences as object) ?? {}),
        ...parsed.sensoryPreferences,
      }),
      cognitivePreferences: toJson({
        ...((existing?.cognitivePreferences as object) ?? {}),
        ...parsed.cognitivePreferences,
      }),
      transportRequirements: toJson({
        ...((existing?.transportRequirements as object) ?? {}),
        ...parsed.transportRequirements,
      }),
      digitalPreferences: toJson({
        ...((existing?.digitalPreferences as object) ?? {}),
        ...parsed.digitalPreferences,
      }),
    };

    const updated = existing
      ? await prisma.accessibilityProfile.update({
          where: { userId: user.id },
          data: merged,
        })
      : await prisma.accessibilityProfile.create({
          data: { userId: user.id, ...merged },
        });

    await createAuditEvent({
      actorUserId: user.id,
      actorRole: user.primaryRole as never,
      action: "accessibility.updated",
      entityType: "AccessibilityProfile",
      entityId: updated.id,
      participantId: user.id,
    });

    return jsonOk({ profile: updated });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Update failed", 500);
  }
}
