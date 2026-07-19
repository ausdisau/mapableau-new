import type { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  accessShareSettingsPatchSchema,
  isSharingActive,
  parseAccessShareSettings,
} from "@/lib/access-passport/share-settings";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { grantConsent, revokeConsent } from "@/lib/consent/consent-service";
import { prisma } from "@/lib/prisma";
import type { AccessShareSettings } from "@/types/access-passport";

function toJson(value: AccessShareSettings): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const profile = await prisma.accessibilityProfile.findUnique({
    where: { userId: user.id },
    select: { shareWithProviders: true },
  });

  const settings = parseAccessShareSettings(profile?.shareWithProviders);
  return jsonOk({
    shareSettings: settings,
    sharingActive: isSharingActive(settings),
  });
}

export async function PATCH(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const body = accessShareSettingsPatchSchema.parse(await req.json());
    const existing = await prisma.accessibilityProfile.findUnique({
      where: { userId: user.id },
    });
    const previous = parseAccessShareSettings(existing?.shareWithProviders);

    let consentRecordId = previous.consentRecordId;

    if (previous.active && previous.consentRecordId && (!body.active || body.categories.length === 0)) {
      await revokeConsent(previous.consentRecordId, user.id);
      consentRecordId = undefined;
    }

    if (body.active && body.categories.length > 0) {
      const consent = await grantConsent({
        subjectUserId: user.id,
        createdById: user.id,
        scope: "accessibility.read",
        purpose: body.purpose,
        expiryDate: body.expiresAt ? new Date(body.expiresAt) : undefined,
        shareMode: "always_for_service",
        recipientType: "organisation",
        dataScope: body.categories,
        sourceAction: "access_passport.share_settings",
      });
      consentRecordId = consent.id;
    }

    const next: AccessShareSettings = {
      version: 1,
      categories: body.categories,
      recipientLabel: body.recipientLabel,
      purpose: body.purpose,
      expiresAt: body.expiresAt,
      active: body.active && body.categories.length > 0,
      updatedAt: new Date().toISOString(),
      consentRecordId,
    };

    const updated = existing
      ? await prisma.accessibilityProfile.update({
          where: { userId: user.id },
          data: { shareWithProviders: toJson(next) },
        })
      : await prisma.accessibilityProfile.create({
          data: {
            userId: user.id,
            mobilityNeeds: [],
            communicationPreferences: [],
            sensoryPreferences: {},
            cognitivePreferences: {},
            transportRequirements: {},
            digitalPreferences: {},
            shareWithProviders: toJson(next),
          },
        });

    await createAuditEvent({
      actorUserId: user.id,
      actorRole: user.primaryRole as never,
      action: body.active ? "consent.granted" : "consent.revoked",
      entityType: "AccessibilityProfile",
      entityId: updated.id,
      participantId: user.id,
      metadata: {
        categories: next.categories,
        active: next.active,
        // Do not log requirement values.
      },
    });

    return jsonOk({
      shareSettings: next,
      sharingActive: isSharingActive(next),
    });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not update share settings", 500);
  }
}
